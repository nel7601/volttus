import logging
from pyemvue import PyEmVue
from pyemvue.enums import Scale, Unit

logger = logging.getLogger(__name__)


class EmporiaClient:
    def __init__(self):
        self.vue = PyEmVue()

    def login(self, email: str, password: str):
        """Authenticate with Emporia cloud."""
        logger.info(f"Logging in to Emporia as {email}")
        logged_in = self.vue.login(username=email, password=password)
        if not logged_in:
            raise Exception(f"Emporia login returned False for {email}. Check credentials.")
        logger.info("Emporia login successful")

    def get_devices(self):
        """Fetch all devices for the authenticated account."""
        devices = self.vue.get_devices()
        logger.info(f"Found {len(devices)} devices")
        return devices

    def get_usage(self, devices, scale=Scale.MINUTE.value, unit=Unit.KWH.value):
        """Fetch current usage for all channels across all devices."""
        device_gids = [d.device_gid for d in devices]
        usage = self.vue.get_device_list_usage(
            deviceGids=device_gids,
            instant=None,
            scale=scale,
            unit=unit,
        )
        return usage
