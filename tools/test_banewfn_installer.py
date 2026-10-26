#!/usr/bin/env python3
"""Exercise the public installer with local CPack bundles and a pseudo terminal."""
import copy
import fcntl
import hashlib
import json
import os
import pty
import select
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "assets/files/banewfn/install.sh"


class InstallerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not shutil.which("cpack"):
            raise unittest.SkipTest("cpack is required to make real STGZ fixtures")
        cls.shared = tempfile.TemporaryDirectory(prefix="banewfn-installer-packages-")
        cls.assets = Path(cls.shared.name)
        cls.releases = []
        for release_id, version, prerelease, files in (
            (101, "1.0.0", False, {"a.conf": "alpha one\n", "custom.conf": "default one\n", "removed.conf": "old\n"}),
            (102, "1.1.0", False, {"a.conf": "alpha two\n", "custom.conf": "default two\n", "new.conf": "new\n"}),
            (103, "1.2.0rc1", True, {"a.conf": "alpha rc\n", "custom.conf": "default rc\n"}),
        ):
            source = cls.assets / version
            (source / "bin").mkdir(parents=True)
            (source / "share/banewfn/conf").mkdir(parents=True)
            for name, body in files.items():
                (source / "share/banewfn/conf" / name).write_text(body)
            for name in ("banewfn", "bwpack"):
                executable = source / "bin" / name
                executable.write_text("#!/bin/sh\n" + ("if [ \"$1\" != \"--help\" ]; then exit 2; fi\n" if name == "banewfn" else "") + "printf '%s\\n' 'BaneWfn {}'\n".format(version))
                executable.chmod(0o755)
            config = cls.assets / (version + ".cmake")
            config.write_text('\n'.join([
                'set(CPACK_GENERATOR "STGZ")',
                'set(CPACK_PACKAGE_NAME "banewfn")',
                'set(CPACK_PACKAGE_VENDOR "installer fixture")',
                'set(CPACK_PACKAGE_VERSION "{}")'.format(version),
                'set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "installer fixture")',
                'set(CPACK_PACKAGE_DESCRIPTION "installer fixture")',
                'set(CPACK_PACKAGE_FILE_NAME "banewfn-{}-linux-x86_64")'.format(version),
                'set(CPACK_PACKAGE_DIRECTORY "{}")'.format(cls.assets),
                'set(CPACK_INSTALLED_DIRECTORIES "{};/")'.format(source),
            ]) + '\n')
            result = subprocess.run(["cpack", "--config", str(config)], cwd=str(cls.assets), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            if result.returncode:
                raise RuntimeError(result.stdout.decode())
            archive = cls.assets / ("banewfn-" + version + "-linux-x86_64.sh")
            cls.releases.append({"id": release_id, "tag_name": "ci-" + str(release_id), "prerelease": prerelease,
                                 "draft": False, "published_at": "2026-10-{:02d}T00:00:00Z".format(release_id - 100),
                                 "assets": [{"name": archive.name, "digest": "sha256:" + hashlib.sha256(archive.read_bytes()).hexdigest(),
                                             "browser_download_url": "https://github.com/bane-dysta/banewfn/releases/download/ci-{}/{}".format(release_id, archive.name)}]})

    @classmethod
    def tearDownClass(cls):
        cls.shared.cleanup()

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="banewfn-installer-test-")
        self.root = Path(self.temporary.name)
        self.home = self.root / "home"
        self.home.mkdir()
        self.prefix = self.home / ".local/share/banewfn"
        self.bin_dir = self.home / ".local/bin"
        self.profile = self.home / ".bashrc"
        self.profile.write_text("# existing shell settings\nexport KEEP_THIS=yes\n")
        self.control = self.root / "control.json"
        self.control.write_text(json.dumps({"release": self.releases[0], "all": list(reversed(self.releases)), "assets": str(self.assets)}))
        self.stub = self.root / "stub"
        self.stub.mkdir()
        python_stub = self.stub / "python3"
        python_stub.write_text("#!" + sys.executable + '\n' + '''
import os, sys
from pathlib import Path
from unittest.mock import patch
source = sys.stdin.read()
sys.argv = sys.argv[1:]
replace = os.replace
marker = Path(os.environ["BANEWFN_FIXTURE_ROOT"]) / "fail-switch"
def replace_once(src, dst):
    if Path(dst).name == "current" and marker.exists():
        marker.unlink()
        raise OSError("fixture: switch failed")
    return replace(src, dst)
with patch.object(Path, "home", return_value=Path(os.environ["BANEWFN_FIXTURE_HOME"])), patch.object(os, "replace", side_effect=replace_once):
    exec(compile(source, "installer", "exec"), {"__name__": "__main__"})
''')
        python_stub.chmod(0o755)
        curl = self.stub / "curl"
        curl.write_text("#!" + sys.executable + '\n' + '''
import json, os, shutil, sys
from pathlib import Path
args = sys.argv[1:]
control = json.loads(Path(os.environ["BANEWFN_FIXTURE_CONTROL"]).read_text())
url = args[-1]
output = Path(args[args.index("--output") + 1])
if control.get("network_fail"):
    sys.exit(22)
if url.endswith("/releases/latest"):
    output.write_text(json.dumps(control["release"]))
elif "/releases/tags/" in url:
    tag = url.split("/releases/tags/", 1)[1]
    output.write_text(json.dumps(next(r for r in control["all"] if r["tag_name"] == tag)))
elif "/releases?" in url:
    output.write_text(json.dumps(control["all"]))
else:
    asset = Path(control["assets"]) / url.rsplit("/", 1)[1]
    shutil.copyfile(str(asset), str(output))
    if control.get("corrupt"):
        with output.open("ab") as stream:
            stream.write(b"corruption")
''')
        curl.chmod(0o755)
        self.environment = dict(os.environ)
        self.environment.update({"PATH": str(self.stub) + os.pathsep + os.environ["PATH"],
                                 "BANEWFN_FIXTURE_ROOT": str(self.root), "BANEWFN_FIXTURE_HOME": str(self.home),
                                 "BANEWFN_FIXTURE_CONTROL": str(self.control), "SHELL": "/bin/bash"})

    def tearDown(self):
        self.temporary.cleanup()

    def invoke(self, *args, expected=0):
        result = subprocess.run(["bash", "-s", "--"] + list(args), input=SCRIPT.read_bytes(),
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=self.environment,
                                start_new_session=True, timeout=30)
        self.assertEqual(result.returncode, expected, result.stdout.decode())
        return result.stdout.decode()

    def change_release(self, index, **changes):
        control = json.loads(self.control.read_text())
        control["release"] = copy.deepcopy(self.releases[index])
        control.update(changes)
        self.control.write_text(json.dumps(control))

    def version(self):
        return subprocess.check_output([str(self.bin_dir / "banewfn"), "--help"]).decode().strip()

    def test_first_install_and_environment(self):
        self.invoke("--yes", "--cores", "2", "--multiwfn", "/opt/Multiwfn/Multiwfn")
        self.assertEqual(self.version(), "BaneWfn 1.0.0")
        rc = (self.home / ".bane/wfn/banewfn.rc").read_text()
        self.assertIn("cores=2\n", rc)
        self.assertIn("Multiwfn_exec=/opt/Multiwfn/Multiwfn\n", rc)
        self.assertIn("export KEEP_THIS=yes", self.profile.read_text())
        self.assertEqual(self.profile.read_text().count("# >>> BaneWfn >>>"), 1)
        env = shlex.quote(str(self.prefix / "env.sh"))
        path = subprocess.check_output(["bash", "--noprofile", "--norc", "-c", ". " + env + "; . " + env + '; printf %s "$PATH"'], env=self.environment).decode()
        self.assertEqual(path.split(os.pathsep).count(str(self.bin_dir)), 1)

    def test_update_preserves_custom_config_and_removes_old_stock(self):
        self.invoke("--yes")
        conf = self.home / ".bane/wfn"
        (conf / "custom.conf").write_text("my module\n")
        original_rc = (conf / "banewfn.rc").read_bytes()
        self.change_release(1)
        self.invoke("--yes")
        self.assertEqual(self.version(), "BaneWfn 1.1.0")
        self.assertEqual((conf / "a.conf").read_text(), "alpha two\n")
        self.assertEqual((conf / "custom.conf").read_text(), "my module\n")
        self.assertEqual((conf / "banewfn.rc").read_bytes(), original_rc)
        self.assertFalse((conf / "removed.conf").exists())
        self.assertEqual((conf / "new.conf").read_text(), "new\n")
        candidates = list((self.prefix / "config-updates").rglob("custom.conf"))
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0].read_text(), "default two\n")

    def test_rollback_merges_modules_and_preserves_resources(self):
        self.invoke("--yes", "--cores", "3")
        self.change_release(1)
        self.invoke("--yes")
        conf = self.home / ".bane/wfn"
        (conf / "custom.conf").write_text("keep after rollback\n")
        self.invoke("--rollback", "--yes")
        self.assertEqual(self.version(), "BaneWfn 1.0.0")
        self.assertEqual((conf / "a.conf").read_text(), "alpha one\n")
        self.assertEqual((conf / "custom.conf").read_text(), "keep after rollback\n")
        self.assertIn("cores=3\n", (conf / "banewfn.rc").read_text())
        self.assertFalse((conf / "new.conf").exists())
        self.assertTrue((conf / "removed.conf").is_file())

    def test_default_uses_stable_and_explicit_prerelease_uses_rc(self):
        self.invoke("--yes")
        self.assertEqual(self.version(), "BaneWfn 1.0.0")
        self.invoke("--yes", "--prerelease")
        self.assertEqual(self.version(), "BaneWfn 1.2.0rc1")

    def test_tag_uses_actual_release_tag(self):
        self.invoke("--yes", "--tag", "ci-102")
        self.assertEqual(self.version(), "BaneWfn 1.1.0")

    def test_repeat_install_is_idempotent(self):
        self.invoke("--yes")
        profile = self.profile.read_bytes()
        rc = (self.home / ".bane/wfn/banewfn.rc").read_bytes()
        output = self.invoke("--yes")
        self.assertIn("已是当前版本", output)
        self.assertEqual(self.profile.read_bytes(), profile)
        self.assertEqual((self.home / ".bane/wfn/banewfn.rc").read_bytes(), rc)

    def test_install_through_directory_alias_remains_idempotent(self):
        target = self.home / "real-program"
        target.mkdir()
        alias = self.home / "program-alias"
        alias.symlink_to(target, target_is_directory=True)
        self.invoke("--yes", "--prefix", str(alias))
        self.assertIn("已是当前版本", self.invoke("--yes"))
        self.assertFalse((target / "previous").exists())
        self.assertEqual(alias.resolve(), target)

    def test_checksum_failure_leaves_old_installation(self):
        self.invoke("--yes")
        rc = (self.home / ".bane/wfn/banewfn.rc").read_bytes()
        self.change_release(1, corrupt=True)
        self.assertIn("SHA-256 不匹配", self.invoke("--yes", "--cores", "6", expected=1))
        self.assertEqual(self.version(), "BaneWfn 1.0.0")
        self.assertEqual((self.home / ".bane/wfn/banewfn.rc").read_bytes(), rc)

    def test_network_failure_leaves_old_installation(self):
        self.invoke("--yes")
        self.change_release(1, network_fail=True)
        self.assertIn("下载失败", self.invoke("--yes", expected=1))
        self.assertEqual(self.version(), "BaneWfn 1.0.0")

    def test_missing_checksum_stops_installation(self):
        control = json.loads(self.control.read_text())
        control["release"]["assets"][0].pop("digest")
        self.control.write_text(json.dumps(control))
        self.assertIn("缺少 SHA-256", self.invoke("--yes", expected=1))
        self.assertFalse((self.prefix / "current").exists())
        self.assertFalse((self.home / ".bane/wfn/banewfn.rc").exists())

    def test_checksum_file_fallback(self):
        assets = self.root / "checksum-assets"
        assets.mkdir()
        control = json.loads(self.control.read_text())
        asset = control["release"]["assets"][0]
        digest = asset.pop("digest").split(":", 1)[1]
        shutil.copyfile(str(self.assets / asset["name"]), str(assets / asset["name"]))
        (assets / "SHA256SUMS").write_text(digest + "  " + asset["name"] + "\n")
        control["release"]["assets"].append({"name": "SHA256SUMS", "browser_download_url": "https://github.com/bane-dysta/banewfn/releases/download/ci-101/SHA256SUMS"})
        control["assets"] = str(assets)
        self.control.write_text(json.dumps(control))
        self.invoke("--yes")
        self.assertEqual(self.version(), "BaneWfn 1.0.0")

    def test_transaction_restores_config_profile_and_pointer(self):
        self.invoke("--yes")
        conf = self.home / ".bane/wfn"
        before = {p: p.read_bytes() for p in conf.glob("*.conf")}
        rc, profile = (conf / "banewfn.rc").read_bytes(), self.profile.read_bytes()
        self.change_release(1)
        (self.root / "fail-switch").touch()
        self.invoke("--yes", "--configure", "--cores", "7", expected=1)
        self.assertEqual(self.version(), "BaneWfn 1.0.0")
        self.assertEqual((conf / "banewfn.rc").read_bytes(), rc)
        self.assertEqual(self.profile.read_bytes(), profile)
        self.assertEqual({p: p.read_bytes() for p in conf.glob("*.conf")}, before)
        self.assertFalse((self.prefix / "previous").exists())

    def test_reconfigure_keeps_other_rc_keys(self):
        self.invoke("--yes", "--no-profile")
        rc = self.home / ".bane/wfn/banewfn.rc"
        rc.write_text(rc.read_text().replace("citations_output=references.bib", "citations_output=off") + "custom_setting=keep\n")
        self.invoke("--yes", "--configure", "--cores", "6", "--multiwfn", "/opt/new/Multiwfn", "--no-profile")
        self.assertIn("cores=6\n", rc.read_text())
        self.assertIn("citations_output=off\n", rc.read_text())
        self.assertIn("custom_setting=keep\n", rc.read_text())
        self.assertNotIn("# >>> BaneWfn >>>", self.profile.read_text())

    def test_existing_manual_config_and_binary_are_preserved(self):
        conf = self.home / ".bane/wfn"
        conf.mkdir(parents=True)
        rc = conf / "banewfn.rc"
        rc.write_text("Multiwfn_exec=manual\ncores=8\n")
        self.bin_dir.mkdir(parents=True)
        existing = self.bin_dir / "banewfn"
        existing.write_text("manual binary\n")
        self.invoke("--yes", expected=1)
        self.assertEqual(existing.read_text(), "manual binary\n")
        self.assertEqual(rc.read_text(), "Multiwfn_exec=manual\ncores=8\n")

    def test_without_terminal_requires_explicit_noninteractive_mode(self):
        self.assertIn("配置向导需要终端", self.invoke(expected=1))
        self.assertFalse(self.prefix.exists())

    def test_invalid_resources_fail_before_installing(self):
        self.assertIn("默认核心数", self.invoke("--yes", "--cores", "0", expected=1))
        self.assertFalse(self.prefix.exists())

    def test_concurrent_install_is_rejected(self):
        self.invoke("--yes")
        with (self.home / ".bane/wfn/install.lock").open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.assertIn("另一个 BaneWfn", self.invoke("--yes", expected=1))

    def test_truncated_pipe_never_starts_installing(self):
        result = subprocess.run(["bash"], input=SCRIPT.read_bytes().rsplit(b'banewfn_install "$@"', 1)[0],
                                env=self.environment, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10)
        self.assertEqual(result.returncode, 0)
        self.assertFalse(self.prefix.exists())

    def test_interactive_pipe_reads_controlling_terminal(self):
        prefix = self.home / "program with spaces"
        bin_dir = self.home / "bin with spaces"
        modules = self.home / "modules"
        multiwfn = self.home / "Multiwfn fixture"
        multiwfn.write_text("#!/bin/sh\nexit 0\n")
        multiwfn.chmod(0o755)
        answers = [str(prefix), str(bin_dir), str(modules), str(multiwfn), "2", "y", str(self.profile)]
        pid, terminal = pty.fork()
        if pid == 0:
            try:
                result = subprocess.run(["bash", "-s"], input=SCRIPT.read_bytes(), env=self.environment, timeout=25)
                os._exit(result.returncode)
            except BaseException:
                os._exit(99)
        output = b""
        consumed = 0
        deadline = time.monotonic() + 30
        status = None
        try:
            while time.monotonic() < deadline:
                ready, _, _ = select.select([terminal], [], [], 0.2)
                if ready:
                    try:
                        chunk = os.read(terminal, 65536)
                    except OSError:
                        break
                    if not chunk:
                        break
                    output += chunk
                    if output.rstrip().endswith(b"]:") and consumed < len(answers):
                        os.write(terminal, (answers[consumed] + "\n").encode())
                        consumed += 1
                ended, wait_status = os.waitpid(pid, os.WNOHANG)
                if ended:
                    status = wait_status
                    break
            if status is None:
                ended, status = os.waitpid(pid, os.WNOHANG)
                if not ended:
                    os.kill(pid, 9)
                    _, status = os.waitpid(pid, 0)
            self.assertEqual(os.waitstatus_to_exitcode(status), 0, output.decode(errors="replace"))
            self.assertEqual(consumed, len(answers), output.decode(errors="replace"))
        finally:
            os.close(terminal)
        rc = (self.home / ".bane/wfn/banewfn.rc").read_text()
        self.assertIn("cores=2\n", rc)
        self.assertIn("Multiwfn_exec=" + str(multiwfn), rc)
        self.assertEqual((modules / "a.conf").read_text(), "alpha one\n")
        self.assertEqual(subprocess.check_output([str(bin_dir / "banewfn"), "--help"]).decode().strip(), "BaneWfn 1.0.0")


if __name__ == "__main__":
    unittest.main(verbosity=2)
