import sys
import importlib
import traceback


if __name__ == "__main__":
    _, engine, what = sys.argv
    try:
        module = importlib.import_module(engine)
        engine_class = getattr(module, engine)
        engine = engine_class()
        engine.search(what)
    except Exception as e:
        # sys.stderr.write(str(e))
        sys.stderr.write(f'Error: {e}\n')
        sys.stderr.write(f'Error: {e.__class__.__name__}\n')
        sys.stderr.write(f'Error: {traceback.format_exc()}\n')
        sys.exit(1)