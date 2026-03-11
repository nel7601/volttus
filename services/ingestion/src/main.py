import logging
from datetime import datetime, timezone

from config import settings
from emporia_client import EmporiaClient
from db import Database

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_ingestion_cycle(db: Database):
    """Run one complete ingestion cycle for all active properties."""
    properties = db.get_active_properties_with_emporia()

    if not properties:
        logger.info("No active properties with Emporia accounts found")
        return

    logger.info(f"Starting ingestion for {len(properties)} properties")

    for prop in properties:
        property_id = prop["property_id"]
        property_name = prop["property_name"]

        # Get existing devices to create ingestion run
        devices = db.get_devices_for_property(property_id)
        device_id = devices[0]["id"] if devices else None

        # We need at least a placeholder device_id for the run
        # If no devices exist yet, we'll create the run after sync
        run_id = None

        try:
            # Decrypt emporia credentials
            password = db.decrypt_emporia_password(prop["encrypted_password"])

            # Connect to Emporia
            client = EmporiaClient()
            client.login(prop["account_email"], password)

            # Get devices and sync to DB
            emporia_devices = client.get_devices()
            db.sync_devices_and_channels(
                property_id, prop["emporia_account_id"], emporia_devices
            )

            # Re-fetch devices after sync (may have been created)
            devices = db.get_devices_for_property(property_id)
            if not devices:
                logger.warning(f"No devices found for property {property_name} after sync")
                continue

            device_id = devices[0]["id"]
            run_id = db.create_ingestion_run(property_id, device_id, "CRON")

            # Fetch usage data
            usage_data = client.get_usage(emporia_devices)
            logger.info(f"Usage data: {len(usage_data)} device(s) returned")

            # Write measurements
            records_inserted = 0
            now = datetime.now(timezone.utc)

            for device_usage in usage_data:
                if not device_usage or not hasattr(device_usage, "channels"):
                    logger.warning(f"Skipping device_usage: no channels attr")
                    continue

                channels = device_usage.channels or []
                logger.info(f"Device {device_usage.device_gid}: {len(channels)} channels, type={type(channels).__name__}")

                # Handle both dict and list formats from PyEmVue
                if isinstance(channels, dict):
                    channel_list = channels.values()
                else:
                    channel_list = channels

                for channel_usage in channel_list:
                    ch_num = getattr(channel_usage, "channel_num", None) or 0
                    kwh_value = getattr(channel_usage, "usage", None)
                    channel = db.get_channel_by_emporia_ids(
                        device_usage.device_gid, ch_num
                    )
                    if not channel:
                        logger.debug(f"  ch_num={ch_num}: NOT FOUND in DB")
                        continue
                    if not channel["is_enabled"]:
                        logger.debug(f"  ch_num={ch_num}: disabled")
                        continue

                    logger.debug(f"  ch_num={ch_num}: kwh={kwh_value}, inserting")
                    db.insert_measurement(
                        property_id=property_id,
                        device_id=channel["device_id"],
                        channel_id=channel["id"],
                        measurement_ts=now,
                        kwh=kwh_value,
                        ingestion_run_id=run_id,
                    )
                    records_inserted += 1

                # Update device sync time
                db.update_device_sync_time(device_usage.device_gid)

            # Compute group aggregations
            db.compute_group_measurements(property_id, now, run_id)

            db.complete_ingestion_run(run_id, "SUCCESS", records_inserted)
            logger.info(
                f"Property {property_name}: {records_inserted} measurements inserted"
            )

        except Exception as e:
            logger.error(f"Ingestion failed for property {property_name}: {e}", exc_info=True)
            if run_id:
                db.log_ingestion_error(
                    run_id,
                    property_id,
                    device_id,
                    type(e).__name__,
                    str(e),
                )
                db.complete_ingestion_run(run_id, "FAILED", 0)


def main():
    logger.info("Starting Volttus ingestion service")
    db = Database(settings.database_url, settings.emporia_encryption_key)
    try:
        run_ingestion_cycle(db)
    finally:
        db.close()
    logger.info("Ingestion cycle complete")


if __name__ == "__main__":
    main()
