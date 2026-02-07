class AutoBalancer:
    def __init__(self, engine_class, config):
        self.engine_class = engine_class
        self.config = config

        self.min_edge = 0.03
        self.max_edge = 0.07
        self.target = config.target_edge
        self.learning_rate = 0.8

    def adjust(self, edge):
        gap = self.target - edge

        # Adjust bust multiplier
        self.config.bust_multiplier += self.learning_rate * gap

        # Clamp bust multiplier
        if self.config.bust_multiplier < 0.5:
            self.config.bust_multiplier = 0.5
        if self.config.bust_multiplier > 3.0:
            self.config.bust_multiplier = 3.0

    def run(self, max_iterations=8):
        for i in range(max_iterations):
            engine = self.engine_class(self.config)
            result = engine.simulate()
            edge = result["house_edge"]

            print(f"Iteration {i} — Edge: {edge}")

            if self.min_edge <= edge <= self.max_edge:
                print("Edge stabilized within 3–7% band.")
                return result

            self.adjust(edge)

        return result
