from dataclasses import dataclass, field
from typing import Dict


@dataclass
class Config:
    players: int = 4
    ante: int = 5
    rounds: int = 20000

    # House edge control
    target_edge: float = 0.05
    min_edge: float = 0.03
    max_edge: float = 0.07

    # Economic tuning
    bust_multiplier: float = 1.0

    tube_initial: Dict[str, float] = field(
        default_factory=lambda: {
            "ST": 5.0,
            "FL": 10.0,
            "FH": 15.0,
            "SF": 20.0,
            "RF": 25.0,
        }
    )
