check:
	ruff check . --fix
	black .
	mypy src/

test:
	pytest --cov=src tests/

coverage-report:
	coverage report -m

lint:
	ruff check src/

clean:
	find . -type d -name "__pycache__" -exec rm -r {} +

setup: clean
	@echo "Setting up EA Assistant..."
	@echo "Creating virtual environment..."
	uv venv
	@echo "Installing dependencies..."
	uv pip install -e ".[dev,test,ai]"
	@echo "Installing pre-commit hooks..."
	uv run pre-commit install
	@echo "Running initial tests..."
	make test
	@echo "Setup complete! Activate the virtual environment with: source .venv/bin/activate"

pre-commit:
	pre-commit run --all-files

.PHONY: check test lint clean setup pre-commit coverage-report
