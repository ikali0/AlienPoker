import random
from config import Config

class GameEngine:
    def __init__(self, config: Config):
        self.config = config
        self.house_net = 0.0

    def run_round(self):
        for _ in range(self.config.players):
            r = random.random()

            # Slight bias toward house for stability
            if r < 0.47:
                self.house_net -= self.config.ante
            elif r < 0.95:
                self.house_net += self.config.ante
            else:
                # Bust event
                self.house_net += (
                    self.config.ante *
                    self.config.bust_multiplier
                )

    def simulate(self):
        self.house_net = 0.0

        for _ in range(self.config.rounds):
            self.run_round()

        total_input = (
            self.config.rounds *
            self.config.players *
            self.config.ante
        )

        house_edge = self.house_net / total_input

        return {
            "house_net": round(self.house_net, 2),
            "house_edge": round(house_edge, 4)
        }
