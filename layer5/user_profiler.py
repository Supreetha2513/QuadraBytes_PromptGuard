# layer5/user_profiler.py
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

PROFILE_FILE = "user_profiles.json"

class UserProfiler:
    """
    Layer 5: Dynamic Profiling & Automated Playbooks (with real enforcement)
    """
    def __init__(self):
        self.profiles = self._load_profiles()

    def _load_profiles(self) -> Dict[str, Any]:
        if os.path.exists(PROFILE_FILE):
            try:
                with open(PROFILE_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_profiles(self):
        with open(PROFILE_FILE, "w") as f:
            json.dump(self.profiles, f, indent=2)

    def enforce_playbook(self, user_id: str) -> Optional[str]:
        """
        Check current status and enforce playbook.
        Returns: None (allow) or error message (block)
        """
        if user_id not in self.profiles:
            # Full default profile on first touch
            self.profiles[user_id] = {
                "score": 0,
                "status": "LOW_RISK",
                "last_prompt_time": None,
                "banned": False,
                "events": []
            }
            self._save_profiles()

        profile = self.profiles[user_id]

        if profile.get("banned", False):
            return "🚫 ACCESS DENIED: User banned (Playbook B activated). Contact SOC."

        if profile["status"] == "MEDIUM_RISK":
            last_time_str = profile.get("last_prompt_time")
            if last_time_str:
                last_time = datetime.fromisoformat(last_time_str)
                if datetime.now() - last_time < timedelta(minutes=1):  # ← 1 minute for demo
                    remaining = timedelta(minutes=1) - (datetime.now() - last_time)
                    mins = int(remaining.total_seconds() // 60)
                    secs = int(remaining.total_seconds() % 60)
                    return f"⏳ RATE LIMITED (Playbook A): 1 prompt per minute. Try again in {mins}m {secs}s."

        # Allow prompt and update last time
        profile["last_prompt_time"] = datetime.now().isoformat()
        self._save_profiles()
        return None  # Allow the prompt

    def update_score(self, user_id: str, event: str):
        """
        Update score and status based on event
        """
        if user_id not in self.profiles:
            self.profiles[user_id] = {
                "score": 0,
                "events": [],
                "status": "LOW_RISK",
                "last_prompt_time": None,
                "banned": False
            }

        profile = self.profiles[user_id]

        # Score update
        if event == "normal":
            profile["score"] = max(0, profile["score"] - 1)
        elif event == "probe":
            profile["score"] += 3
        elif event == "breach":
            profile["score"] += 10

        # Update status and playbook
        if profile["score"] >= 30:
            profile["status"] = "HIGH_RISK"
            profile["banned"] = True  # Permanent ban
        elif profile["score"] >= 12:
            profile["status"] = "MEDIUM_RISK"
        else:
            profile["status"] = "LOW_RISK"

        # Record event
        profile["events"].append({
            "event": event,
            "time": datetime.now().isoformat(),
            "score": profile["score"]
        })
        if len(profile["events"]) > 50:
            profile["events"] = profile["events"][-50:]

        self._save_profiles()
        return profile

# Global singleton instance
profiler = UserProfiler()

# Public convenience functions
def enforce_playbook(user_id: str) -> Optional[str]:
    return profiler.enforce_playbook(user_id)

def update_user_score(user_id: str, event: str):
    profiler.update_score(user_id, event)

def get_user_status(user_id: str) -> Dict[str, Any]:
    return profiler.profiles.get(user_id, {
        "status": "LOW_RISK",
        "score": 0,
        "banned": False,
        "events": []
    })