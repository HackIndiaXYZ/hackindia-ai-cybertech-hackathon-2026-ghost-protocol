import os

# Must run before the app is imported, so tests never touch the real database.
os.environ["DATABASE_URL"] = "sqlite:///./test_goldenhour.db"
