import json
import logging
from datetime import datetime, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, database_url: str, encryption_key: str):
        self.conn = psycopg2.connect(database_url)
        self.conn.autocommit = True
        self.encryption_key = bytes.fromhex(encryption_key)

    def close(self):
        self.conn.close()

    def decrypt_emporia_password(self, encrypted_text: str) -> str:
        """Decrypt AES-256-GCM encrypted password (compatible with Node.js crypto)."""
        parts = encrypted_text.split(":")
        iv = bytes.fromhex(parts[0])
        tag = bytes.fromhex(parts[1])
        ciphertext = bytes.fromhex(parts[2])
        # AES-GCM: ciphertext + tag concatenated
        aesgcm = AESGCM(self.encryption_key)
        plaintext = aesgcm.decrypt(iv, ciphertext + tag, None)
        return plaintext.decode("utf-8")

    def get_active_properties_with_emporia(self) -> list[dict]:
        """Get all active properties that have an Emporia account configured."""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    p.id as property_id,
                    p.property_name,
                    ea.id as emporia_account_id,
                    ea.account_email,
                    ea.encrypted_password
                FROM properties p
                JOIN emporia_accounts ea ON ea.property_id = p.id
                WHERE p.is_active = true AND ea.status = 'active'
            """)
            return [dict(row) for row in cur.fetchall()]

    def get_devices_for_property(self, property_id: str) -> list[dict]:
        """Get devices for a property."""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM devices WHERE property_id = %s AND is_active = true",
                (property_id,),
            )
            return [dict(row) for row in cur.fetchall()]

    def sync_devices_and_channels(
        self, property_id: str, emporia_account_id: str, emporia_devices
    ):
        """Create or update device and channel records from Emporia API response."""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            for dev in emporia_devices:
                # Upsert device
                cur.execute(
                    """
                    INSERT INTO devices (id, property_id, emporia_account_id, emporia_device_gid,
                                        device_name, channel_count, created_at, updated_at)
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, now(), now())
                    ON CONFLICT (emporia_device_gid)
                    DO UPDATE SET device_name = EXCLUDED.device_name,
                                  last_seen_at = now(),
                                  updated_at = now()
                    RETURNING id
                    """,
                    (
                        property_id,
                        emporia_account_id,
                        dev.device_gid,
                        dev.device_name or f"Vue {dev.device_gid}",
                        len(dev.channels) if dev.channels else 16,
                    ),
                )
                device_row = cur.fetchone()
                device_id = device_row["id"]

                # Sync channels
                if dev.channels:
                    for channel in dev.channels:
                        ch_num = getattr(channel, "channel_num", None) or 0
                        ch_name = getattr(channel, "name", None) or f"Channel {ch_num}"
                        is_main = str(ch_num) in ("1,2,3") or ch_name.lower() in (
                            "main",
                            "mainsfromgrid",
                            "mainstogrid",
                            "balance",
                            "totalusage",
                        )

                        cur.execute(
                            """
                            INSERT INTO channels (id, property_id, device_id, emporia_channel_id,
                                                  channel_number, raw_name, display_name,
                                                  is_main_channel, created_at, updated_at)
                            VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, now(), now())
                            ON CONFLICT (device_id, channel_number)
                            DO UPDATE SET raw_name = EXCLUDED.raw_name,
                                          updated_at = now()
                            """,
                            (
                                property_id,
                                device_id,
                                str(ch_num),
                                int(ch_num) if str(ch_num).isdigit() else 0,
                                ch_name,
                                ch_name,
                                is_main,
                            ),
                        )

                logger.info(
                    f"Synced device {dev.device_gid} with {len(dev.channels) if dev.channels else 0} channels"
                )

    def get_channel_by_emporia_ids(
        self, device_gid: int, channel_num
    ) -> dict | None:
        """Look up channel by Emporia device GID and channel number."""
        ch_number = int(channel_num) if str(channel_num).isdigit() else 0
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT c.id, c.device_id, c.is_enabled, c.assigned_group_id
                FROM channels c
                JOIN devices d ON d.id = c.device_id
                WHERE d.emporia_device_gid = %s AND c.channel_number = %s
                """,
                (device_gid, ch_number),
            )
            row = cur.fetchone()
            return dict(row) if row else None

    def insert_measurement(
        self,
        property_id: str,
        device_id: str,
        channel_id: str,
        measurement_ts: datetime,
        kwh: float | None,
        ingestion_run_id: str,
    ):
        """Insert a single measurement row."""
        # Convert kWh to watts (approximate: kWh_per_minute * 60 * 1000)
        watts = None
        if kwh is not None and kwh > 0:
            watts = kwh * 60 * 1000  # kWh per minute → watts

        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO measurements (id, property_id, device_id, channel_id,
                                          measurement_ts, watts, kwh, ingestion_run_id, created_at)
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, now())
                """,
                (
                    property_id,
                    device_id,
                    channel_id,
                    measurement_ts,
                    watts,
                    kwh,
                    ingestion_run_id,
                ),
            )

    def compute_group_measurements(
        self, property_id: str, measurement_ts: datetime, ingestion_run_id: str
    ):
        """Aggregate channel measurements into group totals."""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT cg.id as group_id,
                       SUM(m.watts) as total_watts,
                       SUM(m.kwh) as total_kwh
                FROM channel_groups cg
                JOIN channels c ON c.assigned_group_id = cg.id AND c.is_enabled = true
                JOIN measurements m ON m.channel_id = c.id AND m.measurement_ts = %s
                WHERE cg.property_id = %s AND cg.is_active = true
                GROUP BY cg.id
                """,
                (measurement_ts, property_id),
            )
            for row in cur.fetchall():
                cur.execute(
                    """
                    INSERT INTO group_measurements (id, property_id, group_id,
                                                    measurement_ts, total_watts, total_kwh,
                                                    ingestion_run_id)
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        property_id,
                        row["group_id"],
                        measurement_ts,
                        row["total_watts"],
                        row["total_kwh"],
                        ingestion_run_id,
                    ),
                )

    def create_ingestion_run(
        self, property_id: str, device_id: str, trigger_type: str = "CRON"
    ) -> str:
        """Create an ingestion run record and return its ID."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ingestion_runs (id, property_id, device_id, started_at,
                                            status, trigger_type, created_at)
                VALUES (gen_random_uuid()::text, %s, %s, now(), 'RUNNING', %s, now())
                RETURNING id
                """,
                (property_id, device_id, trigger_type),
            )
            return cur.fetchone()[0]

    def complete_ingestion_run(
        self, run_id: str, status: str, records_inserted: int
    ):
        """Mark an ingestion run as completed."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ingestion_runs
                SET finished_at = now(), status = %s, records_inserted = %s
                WHERE id = %s
                """,
                (status, records_inserted, run_id),
            )

    def log_ingestion_error(
        self,
        run_id: str,
        property_id: str,
        device_id: str | None,
        error_type: str,
        error_message: str,
    ):
        """Log an ingestion error."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ingestion_errors (id, ingestion_run_id, property_id,
                                              device_id, error_type, error_message, created_at)
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, now())
                """,
                (run_id, property_id, device_id, error_type, error_message),
            )
            cur.execute(
                "UPDATE ingestion_runs SET error_count = error_count + 1 WHERE id = %s",
                (run_id,),
            )

    def update_device_sync_time(self, device_gid: int):
        """Update last_successful_sync_at for a device."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE devices SET last_successful_sync_at = now(), updated_at = now()
                WHERE emporia_device_gid = %s
                """,
                (device_gid,),
            )
