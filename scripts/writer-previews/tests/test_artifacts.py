import importlib.util
from pathlib import Path
import stat
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('artifacts', Path(__file__).parents[1] / 'scripts/artifacts.py')
artifacts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(artifacts)


class ExtractionTests(unittest.TestCase):
    def archive(self, root, name, content=b'hello', mode=None):
        archive = root / 'data.zip'
        with zipfile.ZipFile(archive, 'w') as z:
            info = zipfile.ZipInfo(name)
            if mode is not None:
                info.external_attr = mode << 16
            z.writestr(info, content)
        return archive

    def test_static_files(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            artifacts.extract(self.archive(root, 'article/index.html'), root / 'site')
            self.assertEqual((root / 'site/article/index.html').read_bytes(), b'hello')

    def test_escaping_paths_and_symlinks(self):
        for name, mode in [('../escape', None), ('/tmp/escape', None), ('a\\escape', None),
                           ('C:escape', None), ('link', stat.S_IFLNK | 0o777)]:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                with self.assertRaises(ValueError):
                    artifacts.extract(self.archive(root, name, mode=mode), root / 'site')
                self.assertEqual(list((root / 'site').iterdir()), [])

    def test_duplicate_paths_and_expansion_limit(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            archive = root / 'duplicate.zip'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('x', b'first')
                z.writestr('./x', b'second')
            with self.assertRaises(ValueError):
                artifacts.extract(archive, root / 'site')
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            with self.assertRaises(ValueError):
                artifacts.extract(self.archive(root, 'large', b'x' * (25 * 1024 * 1024 + 1)), root / 'site')

    def test_recovery_evidence_cannot_include_scripts_or_subdirectories(self):
        for name in ['run.sh', 'nested/plan.json']:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                with self.assertRaises(ValueError):
                    artifacts.extract(self.archive(root, name), root / 'evidence', evidence_only=True)


if __name__ == '__main__':
    unittest.main()
