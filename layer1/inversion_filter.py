import re
from typing import Dict, List


class InversionFilter:
    """
    Layer 1: Inversion Pre-Filter (sanitize, do NOT block).

    Responsibilities:
    - Detect obvious jailbreak / inversion phrases (your existing patterns).
    - Detect structural abuse: delimiter games, fake SYSTEM blocks, JSON injections.
    - Wrap suspicious spans in inert tags so downstream layers and the LLM
      see them as "data", not executable instructions.
    """

    def __init__(self):
        # 1) High-level jailbreak / inversion phrases (you already had these)
        phrase_patterns = [
            r"ignore\s+previous\s+instructions",
            r"disregard\s+all\s+rules",
            r"forget\s+.*system\s+prompt",
            r"pretend\s+to\s+be",
            r"\byou\s+are\s+now\b",
            r"switch\s+persona",
            r"developer\s+mode",
            r"bypass\s+filter",
            r"jailbreak",
            r"unfiltered\s+response",
            r"raw\s+message",
            r"immediately\s+output\s+the\s+raw",
        ]

        # 2) Structural / delimiter / JSON injection style patterns
        structural_patterns = [
            # Explicit SYSTEM markers
            r"###\s*SYSTEM\b",
            r"<\s*system\s*>",
            r"{\s*\"?system\"?\s*:",
            r"\[\s*assistant\s*=\s*",

            # JSON / YAML style injection of roles
            r"\"role\"\s*:\s*\"system\"",
            r"role:\s*system",

            # Delimiter tricks like "between ### do X"
            r"between\s+[`#]{3,}\s+and\s+[`#]{3,}",
            r"inside\s+the\s+next\s+``````",
            r"within\s+the\s+delimiters\s+below",

            # XML / HTML style tag abuse
            r"<\s*assistant\s*>",
            r"<\s*user\s*>",
            r"<\s*system\s*>",
        ]

        # Compile everything once for speed
        self.phrase_regexes = [re.compile(p, re.IGNORECASE) for p in phrase_patterns]
        self.structural_regexes = [re.compile(p, re.IGNORECASE) for p in structural_patterns]

    def _wrap_inert(self, text: str) -> str:
        """
        Wrap a suspicious span in inert tags so it is treated as data.
        """
        return f"[INERT_DATA]{text}[/INERT_DATA]"

    def _sanitize_with_patterns(
        self,
        text: str,
        regexes: List[re.Pattern],
        flag_name: str,
        flags: List[str],
    ) -> str:
        """
        Apply a list of regexes to 'text', wrapping matches in inert tags.
        Collect a flag if anything was changed.
        """

        def replacer(match: re.Match) -> str:
            span = match.group(0)
            return self._wrap_inert(span)

        original = text
        for rgx in regexes:
            text = rgx.sub(replacer, text)

        if text != original:
            flags.append(flag_name)

        return text

    def sanitize(self, user_input: str) -> Dict:
        """
        Main API for Layer 1.

        Input:
            user_input: raw user text

        Output dict:
            {
              "sanitized_text": "<possibly wrapped text>",
              "flags": ["phrase_jailbreak", "structural_abuse", ...]
            }

        NOTE: This NEVER blocks. It only annotates and wraps.
        """

        if not isinstance(user_input, str):
            # For safety, cast to string so the rest of the pipeline doesn't blow up
            user_input = str(user_input)

        text = user_input
        flags: List[str] = []

        # 1) Phrase-level jailbreak patterns
        text = self._sanitize_with_patterns(
            text,
            self.phrase_regexes,
            flag_name="phrase_jailbreak",
            flags=flags,
        )

        # 2) Structural / delimiter / JSON / SYSTEM tricks
        text = self._sanitize_with_patterns(
            text,
            self.structural_regexes,
            flag_name="structural_abuse",
            flags=flags,
        )

        return {
            "sanitized_text": text,
            "flags": flags,
        }

    # Optional: keep old check() method for backward compatibility
    def check(self, user_input: str) -> bool:
        """
        Legacy method: returns True if any risky pattern is found.
        Not used in the new pipeline, but kept so main.py doesn't break
        until you migrate to sanitize().
        """
        merged = self.phrase_regexes + self.structural_regexes
        for regex in merged:
            if regex.search(user_input or ""):
                return True
        return False