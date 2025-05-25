check:
	ruff check . --fix
	black .
	mypy src/
	pytest tests/

test:
	python run_tests.py

lint:
	ruff check src/

clean:
	find . -type d -name "__pycache__" -exec rm -r {} +

setup: clean
	@echo "Setting up EA Assistant..."
	@echo "Creating virtual environment..."
	python -m venv .venv
	@echo "Installing dependencies..."
	. .venv/bin/activate && pip install -r requirements.txt
	@echo "Installing pre-commit hooks..."
	. .venv/bin/activate && pre-commit install
	@echo "Running initial tests..."
	. .venv/bin/activate && python run_tests.py
	@echo "Setup complete! Activate the virtual environment with: source .venv/bin/activate"

pre-commit:
	pre-commit run --all-files

.PHONY: check test lint clean setup pre-commit
