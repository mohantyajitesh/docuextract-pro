"""
DocuExtract Pro - License Validation System
Supports offline validation with trial mode.
"""
import os
import json
import hashlib
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class LicenseValidator:
    """
    License validation with offline support.

    License Types:
    - TRIAL: 10 documents, 14 days
    - PERSONAL: Unlimited documents, 1 machine, personal use
    - PROFESSIONAL: Unlimited documents, 2 machines, commercial use
    - BUSINESS: Unlimited documents, 5 machines, priority support

    Key Format: XXXX-XXXX-XXXX-XXXX (contains encoded type + expiry + checksum)
    """

    LICENSE_FILE = Path.home() / ".docuextract" / "license.json"
    TRIAL_LIMIT = 10
    TRIAL_DAYS = 14

    LICENSE_TYPES = {
        "TRIAL": {"documents": 10, "machines": 1, "commercial": False},
        "PERSONAL": {"documents": -1, "machines": 1, "commercial": False},
        "PROFESSIONAL": {"documents": -1, "machines": 2, "commercial": True},
        "BUSINESS": {"documents": -1, "machines": 5, "commercial": True},
    }

    def __init__(self):
        self._license_data: Optional[Dict] = None
        self._machine_id = self._get_machine_id()
        self._load_license()

    def _get_machine_id(self) -> str:
        """Generate a unique machine identifier."""
        import platform

        components = [
            platform.node(),
            platform.machine(),
            platform.processor(),
        ]
        raw = "-".join(components).encode()
        return hashlib.sha256(raw).hexdigest()[:16]

    def _load_license(self):
        """Load license from file or create trial."""
        if self.LICENSE_FILE.exists():
            try:
                with open(self.LICENSE_FILE, 'r') as f:
                    self._license_data = json.load(f)
            except:
                self._license_data = None

        if not self._license_data:
            self._create_trial()

    def _save_license(self):
        """Save license to file."""
        self.LICENSE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(self.LICENSE_FILE, 'w') as f:
            json.dump(self._license_data, f, indent=2)

    def _create_trial(self):
        """Create a new trial license."""
        self._license_data = {
            "type": "TRIAL",
            "key": None,
            "machine_id": self._machine_id,
            "activated_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=self.TRIAL_DAYS)).isoformat(),
            "documents_processed": 0,
            "machines": [self._machine_id]
        }
        self._save_license()

    def _validate_key_format(self, key: str) -> bool:
        """Validate license key format."""
        import re
        pattern = r'^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'
        return bool(re.match(pattern, key.upper()))

    def _decode_key(self, key: str) -> Optional[Dict]:
        """
        Decode license key to extract type and expiry.

        Key structure (simplified for demo):
        - First 4 chars: License type code
        - Middle 8 chars: Encoded expiry
        - Last 4 chars: Checksum

        In production, use proper cryptographic signing.
        """
        key = key.upper().replace("-", "")

        if len(key) != 16:
            return None

        # Type codes
        type_codes = {
            "PERS": "PERSONAL",
            "PROF": "PROFESSIONAL",
            "BUSI": "BUSINESS"
        }

        type_code = key[:4]
        if type_code not in type_codes:
            return None

        # Validate checksum (simplified)
        data_part = key[:12]
        checksum = key[12:16]
        expected_checksum = hashlib.md5(data_part.encode()).hexdigest()[:4].upper()

        if checksum != expected_checksum:
            return None

        # Decode expiry (in production, properly encrypted)
        # For now, assume 1 year from activation
        return {
            "type": type_codes[type_code],
            "valid": True
        }

    def activate(self, license_key: str) -> bool:
        """Activate a license key."""
        if not self._validate_key_format(license_key):
            return False

        decoded = self._decode_key(license_key)
        if not decoded:
            return False

        license_type = decoded["type"]
        max_machines = self.LICENSE_TYPES[license_type]["machines"]

        # Check if this machine can be added
        existing_machines = self._license_data.get("machines", [])
        if self._machine_id not in existing_machines:
            if len(existing_machines) >= max_machines:
                return False
            existing_machines.append(self._machine_id)

        self._license_data = {
            "type": license_type,
            "key": license_key.upper(),
            "machine_id": self._machine_id,
            "activated_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=365)).isoformat(),
            "documents_processed": 0,
            "machines": existing_machines
        }
        self._save_license()
        return True

    def is_valid(self) -> bool:
        """Check if current license is valid."""
        if not self._license_data:
            return False

        # Check expiry
        expires_at = datetime.fromisoformat(self._license_data["expires_at"])
        if datetime.now() > expires_at:
            return False

        # Check machine
        if self._machine_id not in self._license_data.get("machines", [self._machine_id]):
            return False

        # Check trial limits
        if self._license_data["type"] == "TRIAL":
            if self._license_data["documents_processed"] >= self.TRIAL_LIMIT:
                return False

        return True

    def can_process(self) -> bool:
        """Check if user can process another document."""
        if not self.is_valid():
            return False

        license_type = self._license_data["type"]
        type_info = self.LICENSE_TYPES[license_type]

        if type_info["documents"] == -1:
            return True

        return self._license_data["documents_processed"] < type_info["documents"]

    def record_usage(self):
        """Record a document processing."""
        if self._license_data:
            self._license_data["documents_processed"] += 1
            self._save_license()

    def get_license_info(self) -> Dict[str, Any]:
        """Get current license information."""
        if not self._license_data:
            return {"valid": False, "type": None}

        license_type = self._license_data["type"]
        type_info = self.LICENSE_TYPES.get(license_type, {})

        return {
            "valid": self.is_valid(),
            "type": license_type,
            "key": self._license_data.get("key"),
            "activated_at": self._license_data.get("activated_at"),
            "expires_at": self._license_data.get("expires_at"),
            "documents_processed": self._license_data.get("documents_processed", 0),
            "documents_limit": type_info.get("documents", 0),
            "machines_count": len(self._license_data.get("machines", [])),
            "machines_limit": type_info.get("machines", 0),
            "commercial_use": type_info.get("commercial", False),
            "remaining": self._get_remaining()
        }

    def _get_remaining(self) -> Dict[str, Any]:
        """Get remaining usage."""
        if not self._license_data:
            return {}

        license_type = self._license_data["type"]
        type_info = self.LICENSE_TYPES.get(license_type, {})

        expires_at = datetime.fromisoformat(self._license_data["expires_at"])
        days_remaining = max(0, (expires_at - datetime.now()).days)

        docs_remaining = None
        if type_info.get("documents", -1) != -1:
            docs_remaining = max(0, type_info["documents"] - self._license_data["documents_processed"])

        return {
            "days": days_remaining,
            "documents": docs_remaining if docs_remaining is not None else "unlimited"
        }

    def get_trial_remaining(self) -> Dict[str, int]:
        """Get remaining trial usage."""
        if not self._license_data or self._license_data["type"] != "TRIAL":
            return {"documents": 0, "days": 0}

        docs = max(0, self.TRIAL_LIMIT - self._license_data["documents_processed"])
        expires_at = datetime.fromisoformat(self._license_data["expires_at"])
        days = max(0, (expires_at - datetime.now()).days)

        return {"documents": docs, "days": days}


def generate_license_key(license_type: str) -> str:
    """
    Generate a license key for testing.

    In production, this would be done server-side with proper cryptographic signing.
    """
    type_codes = {
        "PERSONAL": "PERS",
        "PROFESSIONAL": "PROF",
        "BUSINESS": "BUSI"
    }

    if license_type not in type_codes:
        raise ValueError(f"Invalid license type: {license_type}")

    type_code = type_codes[license_type]
    random_part = uuid.uuid4().hex[:8].upper()
    data_part = type_code + random_part
    checksum = hashlib.md5(data_part.encode()).hexdigest()[:4].upper()

    full_key = data_part + checksum
    return f"{full_key[:4]}-{full_key[4:8]}-{full_key[8:12]}-{full_key[12:16]}"


if __name__ == "__main__":
    # Generate sample keys
    print("Sample License Keys:")
    print(f"  Personal: {generate_license_key('PERSONAL')}")
    print(f"  Professional: {generate_license_key('PROFESSIONAL')}")
    print(f"  Business: {generate_license_key('BUSINESS')}")
