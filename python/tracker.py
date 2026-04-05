import numpy as np

class SimpleTracker:
    def __init__(self):
        self.next_id = 0
        self.objects = {}

    def update(self, detections):
        updated = {}

        for det in detections:
            x1, y1, x2, y2 = det
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            matched_id = None

            for obj_id, (ox, oy) in self.objects.items():
                if abs(cx - ox) < 50 and abs(cy- oy) < 50:
                    matched_id = obj_id
                    break

            if matched_id is None:
                matched_id = self.next_id
                self.next_id += 1

            updated[matched_id] = (cx , cy)

        self.objects = updated
        return updated