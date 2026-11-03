from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class NormalizedFinding:
    severity: str        # CRITICAL, HIGH, MEDIUM, LOW, INFO
    type: str            # QUALITY, SECURITY, MAINTAINABILITY, ARCHITECTURE
    file: str            # Relative file path
    line: int            # 1-indexed line number
    title: str           # Short descriptive title
    description: str     # Why this was flagged
    recommendation: str  # Actionable remediation advice

class BaseAnalyzer(ABC):
    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        pass

    @abstractmethod
    def analyze(self, rel_path: str, content: str) -> List[NormalizedFinding]:
        pass
