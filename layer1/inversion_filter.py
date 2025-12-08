import re

class InversionFilter:
    def __init__(self):
        # Common jailbreak / inversion patterns
        self.patterns = [
            r"ignore\s+previous\s+instructions",
            r"disregard\s+all\s+rules",
            r"forget\s+.*system\s+prompt",
            r"pretend\s+to\s+be",
            r"<\s*system\s*>",
            r"{\s*system\s*:",
            r"###\s*SYSTEM",
            r"\[\s*assistant\s*=\s*",
            r"simulate\s+mode",
            r"switch\s+persona",
            r"jailbreak",
            r"developer\s+mode",
            r"bypass\s+filter",
            r"raw\s+message",
            r"unfiltered\s+response",
            r"immediately\s+output\s+the\s+raw"
        ]

        self.compiled = [re.compile(p, re.IGNORECASE) for p in self.patterns]

    def check(self, user_input: str):
        for regex in self.compiled:
            if regex.search(user_input):
                return True
        return False
