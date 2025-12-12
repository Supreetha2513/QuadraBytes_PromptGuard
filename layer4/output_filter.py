# layer4/output_filter.py
import re
from typing import Dict, List

class OutputFilter:
    """
    Layer 4: Egress Security - The Filter
    Scans LLM output for leaks and jailbreak success.
    """
    def __init__(self):
        self.name = "OutputFilter"

    def filter(self, response: str) -> Dict[str, any]:
        """
        Main filtering function.
        Returns: {
            "safe": bool,
            "sanitized": str,
            "issues": List[str]
        }
        """
        issues: List[str] = []
        sanitized = response

        # 1. PII: Social Security Numbers
        ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
        if re.search(ssn_pattern, response):
            issues.append("PII Detected: SSN")
            sanitized = re.sub(ssn_pattern, "[REDACTED_SSN]", sanitized)

        # 2. Credit Cards (basic pattern)
        cc_pattern = r'\b(?:\d[ -]*?){13,16}\b'
        if re.search(cc_pattern, response):
            issues.append("Potential Credit Card Number")
            sanitized = re.sub(cc_pattern, "[REDACTED_CC]", sanitized)

        # 3. API Keys (common formats)
        api_patterns = [
            r'(?i)sk-[a-zA-Z0-9]{32,}',                  # OpenAI
            r'(?i)ghp_[a-zA-Z0-9]{36}',                  # GitHub
            r'(?i)aws_access_key_id=[A-Z0-9]{20}',
            r'(?i)aws_secret_access_key=[A-Za-z0-9/+=]{40}',
            r'(?i)Bearer\s+[a-zA-Z0-9\-_]{30,}',
        ]
        for pattern in api_patterns:
            if re.search(pattern, response):
                issues.append("API Key Leak")
                sanitized = re.sub(pattern, "[REDACTED_API_KEY]", sanitized)

        # 4. Jailbreak Success / Harmful Instructions
        harmful_indicators = [
            "step.?by.?step", "ingredients", "precursors", "synthesis", "synthesize",
            "build a bomb", "make explosives", "phishing attack", "how to hack",
            "methamphetamine", "ricin", "sarin", "cyanide", "virus code"
        ]
        lower_resp = response.lower()
        if any(indicator in lower_resp for indicator in harmful_indicators):
            if len(response) > 150:  # Avoid flagging short refusals
                issues.append("Potential Harmful Instructions")

        # Final verdict
        is_safe = len(issues) == 0

        return {
            "safe": is_safe,
            "sanitized": sanitized,
            "issues": issues
        }

# Global instance
filter_instance = OutputFilter()

# Convenience function
def filter_output(response: str) -> Dict[str, any]:
    return filter_instance.filter(response)