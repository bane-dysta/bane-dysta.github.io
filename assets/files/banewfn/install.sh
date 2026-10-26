#!/usr/bin/env bash
# Keep execution at the end so an incomplete piped download cannot start installation.
banewfn_install() {
    if ! command -v python3 >/dev/null 2>&1; then
        printf '%s\n' 'BaneWfn 安装需要 Python 3.6 或更新版本，请先通过系统包管理器安装 python3。' >&2
        return 1
    fi
    python3 - "$@" <<'BANEWFN_PYTHON'
import argparse
import datetime
import hashlib
import json
import os
import platform
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from urllib.parse import quote, urlparse

if sys.version_info < (3, 6):
    print("BaneWfn 安装需要 Python 3.6 或更新版本。", file=sys.stderr)
    sys.exit(1)

API = "https://api.github.com/repos/bane-dysta/banewfn"
BEGIN = "# >>> BaneWfn >>>"
END = "# <<< BaneWfn <<<"


class InstallError(Exception):
    pass


def atomic_bytes(path, data, mode):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".banewfn-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, mode)
        os.replace(name, str(path))
    finally:
        if os.path.lexists(name):
            os.unlink(name)


def atomic_link(path, target):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.parent / (".banewfn-link-" + uuid.uuid4().hex)
    try:
        temporary.symlink_to(target)
        os.replace(str(temporary), str(path))
    finally:
        if temporary.is_symlink():
            temporary.unlink()


class Transaction:
    def __init__(self, backup):
        self.backup = backup
        self.entries = {}

    def remember(self, path):
        if path in self.entries:
            return
        if path.is_symlink():
            entry = {"kind": "link", "target": os.readlink(str(path))}
        elif path.exists():
            if not path.is_file():
                raise InstallError("不能替换目录：" + str(path))
            self.backup.mkdir(parents=True, exist_ok=True)
            saved = self.backup / str(len(self.entries))
            shutil.copy2(str(path), str(saved))
            entry = {"kind": "file", "backup": str(saved), "mode": path.stat().st_mode & 0o777}
        else:
            entry = {"kind": "absent"}
        self.entries[path] = entry
        self.backup.mkdir(parents=True, exist_ok=True)
        atomic_bytes(self.backup / "files.json", json.dumps(
            {str(p): e for p, e in self.entries.items()}, ensure_ascii=False, indent=2
        ).encode("utf-8"), 0o600)

    def write(self, path, data, mode=0o644):
        if path.is_file() and not path.is_symlink() and path.read_bytes() == data:
            return
        self.remember(path)
        atomic_bytes(path, data, mode)

    def link(self, path, target):
        if path.is_symlink() and os.readlink(str(path)) == str(target):
            return
        self.remember(path)
        atomic_link(path, target)

    def remove(self, path):
        self.remember(path)
        path.unlink()

    def rollback(self):
        errors = []
        for path, entry in reversed(list(self.entries.items())):
            try:
                if entry["kind"] == "file":
                    atomic_bytes(path, Path(entry["backup"]).read_bytes(), entry["mode"])
                elif entry["kind"] == "link":
                    atomic_link(path, entry["target"])
                elif os.path.lexists(str(path)):
                    path.unlink()
            except OSError as error:
                errors.append(str(error))
        if errors:
            raise InstallError("恢复部分文件失败，请查看备份 " + str(self.backup) + "：" + "; ".join(errors))


def read_rc(path):
    values = {}
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def updated_rc(path, settings):
    lines = path.read_text(encoding="utf-8").splitlines() if path.is_file() else ["# BaneWfn 运行配置"]
    kept = []
    for line in lines:
        key = line.split("=", 1)[0].strip() if "=" in line else ""
        if key not in settings:
            kept.append(line)
    kept.extend(key + "=" + value for key, value in settings.items())
    return ("\n".join(kept) + "\n").encode("utf-8")


class Installer:
    def __init__(self, args):
        self.args = args
        self.home = Path.home()
        self.config_root = self.home / ".bane/wfn"
        self.rc = self.config_root / "banewfn.rc"
        self.registry_path = self.config_root / "install.json"
        self.registry = self.read_json(self.registry_path) if self.registry_path.is_file() else {}
        self.run_id = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ-") + uuid.uuid4().hex[:8]
        self.tty = None
        self.tty_output = None
        if not args.yes:
            try:
                self.tty = open("/dev/tty", "r", encoding="utf-8")
                self.tty_output = open("/dev/tty", "w", encoding="utf-8", buffering=1)
            except OSError:
                if self.tty:
                    self.tty.close()
                self.tty = None
        self.stage = None

    @staticmethod
    def read_json(path):
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError) as error:
            raise InstallError("无法读取 " + str(path) + "：" + str(error))

    def ask(self, label, default):
        if self.args.yes:
            return str(default)
        if self.tty is None:
            raise InstallError("配置向导需要终端。自动安装请使用 --yes，并用参数指定所需配置。")
        self.tty_output.write(label + " [" + str(default) + "]: ")
        self.tty_output.flush()
        answer = self.tty.readline()
        if not answer:
            raise InstallError("配置输入已结束，安装取消。")
        return answer.strip() or str(default)

    def confirm(self, label, default=False):
        while True:
            answer = self.ask(label + " (y/n)", "y" if default else "n").lower()
            if answer in ("y", "yes", "是"):
                return True
            if answer in ("n", "no", "否"):
                return False
            print("请输入 y 或 n。", flush=True)

    def path(self, value):
        value = str(value)
        if value == "~" or value.startswith("~/"):
            value = str(self.home) + value[1:]
        value = os.path.expandvars(value)
        if any(char in value for char in "\n\r\0#$"):
            raise InstallError("路径不能包含换行、# 或未展开的环境变量：" + value)
        return Path(os.path.abspath(value))

    def configure(self):
        args = self.args
        first = not self.registry
        wizard = first or args.configure
        prefix_default = self.registry.get("prefix", str(self.home / ".local/share/banewfn"))
        self.prefix = self.path(args.prefix or (self.ask("安装目录", prefix_default) if wizard else prefix_default)).resolve()
        bin_default = self.registry.get("bin_dir", str(self.home / ".local/bin"))
        self.bin_dir = self.path(args.bin_dir or (self.ask("命令入口目录（加入 PATH）", bin_default) if wizard else bin_default))
        for root in (self.prefix, self.bin_dir):
            if root.resolve() in (Path("/"), self.home.resolve(), self.config_root.resolve()):
                raise InstallError("请使用独立的安装目录或命令入口目录：" + str(root))
        if self.prefix.resolve() == self.bin_dir.resolve():
            raise InstallError("安装目录和命令入口目录必须不同。")
        rc_values = read_rc(self.rc)
        resource_flags = args.multiwfn is not None or args.cores is not None or args.conf_dir is not None
        self.write_rc = not self.rc.is_file() or args.configure or resource_flags
        if wizard and self.rc.is_file() and not args.configure and not resource_flags:
            self.write_rc = self.confirm("已有 banewfn.rc，是否重新配置资源和 Multiwfn 路径", False)
        conf_default = rc_values.get("confpath", str(self.config_root))
        self.conf_dir = self.path(args.conf_dir or (
            self.ask("模块配置目录", conf_default) if self.write_rc and wizard else conf_default
        ))
        if self.conf_dir.resolve() == Path("/") or self.prefix.resolve() in self.conf_dir.resolve().parents or self.conf_dir.resolve() == self.prefix.resolve():
            raise InstallError("模块配置目录应位于程序版本目录之外。")
        self.settings = {}
        if self.write_rc:
            default_exec = rc_values.get("Multiwfn_exec") or shutil.which("Multiwfn") or "Multiwfn"
            multiwfn = args.multiwfn or (self.ask("Multiwfn 可执行文件路径或 PATH 中的命令名", default_exec) if wizard else default_exec)
            while True:
                multiwfn = os.path.expandvars(multiwfn)
                if any(char in multiwfn for char in "\n\r\0#$"):
                    raise InstallError("Multiwfn 路径不能包含换行、# 或未展开的环境变量。")
                if "/" in multiwfn or multiwfn.startswith("~"):
                    multiwfn = str(self.path(multiwfn))
                    found = Path(multiwfn).is_file() and os.access(multiwfn, os.X_OK)
                else:
                    found = shutil.which(multiwfn) is not None
                if found or args.yes:
                    break
                print("尚未找到可执行的 Multiwfn：" + multiwfn, flush=True)
                if self.confirm("保存这个设置，稍后准备 Multiwfn", False):
                    break
                multiwfn = self.ask("Multiwfn 可执行文件路径或命令名", default_exec)
            cpu_count = os.cpu_count() or 1
            default_cores = rc_values.get("cores", str(min(4, cpu_count)))
            cores = str(args.cores) if args.cores is not None else (
                self.ask("默认核心数（可由运行参数覆盖）", default_cores) if wizard else default_cores
            )
            while not cores.isdigit() or not 1 <= int(cores) <= 2147483647:
                if args.yes or args.cores is not None:
                    raise InstallError("默认核心数必须是 1 到 2147483647 之间的整数。")
                cores = self.ask("默认核心数，请输入正整数", min(4, cpu_count))
            self.settings = {"Multiwfn_exec": multiwfn, "confpath": str(self.conf_dir), "cores": str(int(cores))}
            if "citations_output" not in rc_values:
                self.settings["citations_output"] = "references.bib"
            self.missing_multiwfn = not found
        else:
            self.missing_multiwfn = False
        profile_default = self.registry.get("profile")
        if not profile_default:
            profile_default = str(self.home / (".zshrc" if Path(os.environ.get("SHELL", "bash")).name == "zsh" else ".bashrc"))
        self.profile = None
        if not args.no_profile:
            if args.profile:
                self.profile = self.path(args.profile).resolve()
            elif wizard:
                if self.confirm("将 PATH 配置写入 shell 启动文件", True):
                    self.profile = self.path(self.ask("shell 启动文件", profile_default)).resolve()
            elif self.registry.get("profile"):
                self.profile = self.path(self.registry["profile"]).resolve()

    def download(self, url, path, api=False):
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.netloc not in ("api.github.com", "github.com"):
            raise InstallError("下载地址必须来自 GitHub HTTPS：" + url)
        command = ["curl", "--fail", "--location", "--silent", "--show-error", "--proto", "=https",
                   "--proto-redir", "=https", "--retry", "3", "--connect-timeout", "15",
                   "--max-time", "60" if api else "600", "--output", str(path)]
        if api:
            command += ["--header", "Accept: application/vnd.github+json"]
        result = subprocess.run(command + [url], stdin=subprocess.DEVNULL)
        if result.returncode:
            raise InstallError("下载失败（curl 退出码 {}）：{}".format(result.returncode, url))

    def release(self):
        response_path = self.stage / "release.json"
        if self.args.tag:
            endpoint = API + "/releases/tags/" + quote(self.args.tag, safe="")
            self.download(endpoint, response_path, True)
            release = self.read_json(response_path)
        elif self.args.prerelease:
            release = None
            for page in range(1, 11):
                self.download(API + "/releases?per_page=100&page=" + str(page), response_path, True)
                releases = self.read_json(response_path)
                if not isinstance(releases, list):
                    raise InstallError("GitHub 没有返回 Release 列表。")
                choices = [r for r in releases if r.get("prerelease") and not r.get("draft")]
                if choices:
                    release = max(choices, key=lambda r: r.get("published_at") or "")
                    break
                if len(releases) < 100:
                    break
            if release is None:
                raise InstallError("没有找到已发布的 prerelease。")
        else:
            self.download(API + "/releases/latest", response_path, True)
            release = self.read_json(response_path)
            if release.get("prerelease") or release.get("draft"):
                raise InstallError("GitHub latest 未返回正式 Release。")
        if not isinstance(release, dict) or release.get("draft"):
            raise InstallError("指定 Release 不可用。")
        assets = release.get("assets", [])
        packages = [a for a in assets if re.fullmatch(r"banewfn-(.+)-linux-x86_64\.sh", a.get("name", ""))]
        if len(packages) != 1:
            raise InstallError("Release {} 中应有一个 Linux x86_64 .sh 安装包，实际找到 {} 个。".format(release.get("tag_name"), len(packages)))
        asset = packages[0]
        digest = asset.get("digest") or ""
        if not re.fullmatch(r"sha256:[0-9a-fA-F]{64}", digest):
            checksums = [a for a in assets if a.get("name") in (asset["name"] + ".sha256", "SHA256SUMS", "SHA256SUMS.txt")]
            if not checksums:
                raise InstallError("该 Release 缺少 SHA-256 校验值。请维护者为安装包发布 digest 或 SHA256SUMS。")
            checksum_path = self.stage / "SHA256SUMS"
            self.download(checksums[0]["browser_download_url"], checksum_path)
            matches = []
            for line in checksum_path.read_text(encoding="utf-8").splitlines():
                fields = line.split()
                if len(fields) == 2 and fields[1].lstrip("*") in (asset["name"], "./" + asset["name"]):
                    matches.append(fields[0])
                elif len(fields) == 1 and checksums[0]["name"] == asset["name"] + ".sha256":
                    matches.append(fields[0])
            if len(matches) != 1 or not re.fullmatch(r"[0-9a-fA-F]{64}", matches[0]):
                raise InstallError("校验文件中没有唯一有效的安装包 SHA-256。")
            digest = "sha256:" + matches[0]
        if not isinstance(release.get("id"), int) or release["id"] <= 0:
            raise InstallError("Release ID 无效。")
        return {"release_id": release["id"], "tag": release["tag_name"], "asset": asset["name"],
                "url": asset["browser_download_url"], "sha256": digest.split(":", 1)[1].lower(),
                "version": re.fullmatch(r"banewfn-(.+)-linux-x86_64\.sh", asset["name"]).group(1)}

    @staticmethod
    def verify_package(package, metadata):
        for executable in ("banewfn", "bwpack"):
            path = package / "bin" / executable
            if not path.is_file() or not os.access(str(path), os.X_OK):
                raise InstallError("安装包缺少可执行文件：" + str(path))
        result = subprocess.run([str(package / "bin/banewfn"), "--help"],
                                stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, timeout=30)
        pattern = r"(?:Version:|BaneWfn(?:\s+version)?)\s*" + re.escape(metadata["version"]) + r"(?![\w.-])"
        if result.returncode or not re.search(pattern, result.stdout, flags=re.I):
            raise InstallError("程序版本检查失败：" + result.stdout.strip())
        result = subprocess.run([str(package / "bin/bwpack"), "--help"], stdin=subprocess.DEVNULL,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, timeout=30)
        if result.returncode:
            raise InstallError("bwpack 启动检查失败：" + result.stdout.strip())
        conf = package / "share/banewfn/conf"
        if not conf.is_dir() or not list(conf.glob("*.conf")):
            raise InstallError("安装包缺少 share/banewfn/conf 下的模块配置。")
        return conf

    def prepare_package(self, metadata):
        package = self.prefix / "versions" / (str(metadata["release_id"]) + "-" + metadata["sha256"][:16])
        info = package / ".release.json"
        if package.exists():
            if not info.is_file() or self.read_json(info) != metadata:
                raise InstallError("已有版本目录的发布记录不匹配：" + str(package))
            self.verify_package(package, metadata)
            return package
        archive = self.stage / metadata["asset"]
        print("下载 {}（Release {}）".format(metadata["asset"], metadata["tag"]), flush=True)
        self.download(metadata["url"], archive)
        digest = hashlib.sha256()
        with archive.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        if digest.hexdigest() != metadata["sha256"]:
            raise InstallError("安装包 SHA-256 不匹配，已停止安装。")
        extracted = self.stage / "package"
        extracted.mkdir()
        result = subprocess.run(["bash", str(archive), "--skip-license", "--exclude-subdir", "--prefix=" + str(extracted)], stdin=subprocess.DEVNULL)
        if result.returncode:
            raise InstallError("安装包解包失败。")
        self.verify_package(extracted, metadata)
        atomic_bytes(extracted / ".release.json", json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8"), 0o644)
        package.parent.mkdir(parents=True, exist_ok=True)
        os.replace(str(extracted), str(package))
        return package

    def current_package(self, name):
        path = self.prefix / name
        if not os.path.lexists(str(path)):
            return None
        if not path.is_symlink():
            raise InstallError("安装目录中的 {} 不是安装器管理的链接。".format(name))
        resolved = path.resolve()
        if resolved.parent != (self.prefix / "versions").resolve() or not (resolved / ".release.json").is_file():
            raise InstallError("安装目录中的 {} 指向未知版本。".format(name))
        return resolved

    def check_command_links(self):
        for name in ("banewfn", "bwpack"):
            path = self.bin_dir / name
            expected = self.prefix / "current/bin" / name
            if os.path.lexists(str(path)) and not (path.is_symlink() and os.readlink(str(path)) == str(expected)):
                if self.args.yes or not self.confirm("{} 已存在，是否备份后替换".format(path), False):
                    raise InstallError("保留已有命令。请使用 --bin-dir 指定其他命令入口目录。")

    def merge_modules(self, tx, old_package, package):
        stock = package / "share/banewfn/conf"
        old_stock = old_package / "share/banewfn/conf" if old_package and self.registry.get("conf_dir") == str(self.conf_dir) else None
        def files(root):
            return {p.relative_to(root): p for p in root.rglob("*") if p.is_file() and p.name != "banewfn.rc"} if root and root.is_dir() else {}
        new_files, old_files = files(stock), files(old_stock)
        conflicts = []
        for relative in sorted(set(new_files) | set(old_files)):
            destination = self.conf_dir / relative
            new = new_files.get(relative)
            old = old_files.get(relative)
            # A user symlink or a parent symlink counts as a custom configuration.
            custom_link = destination.is_symlink() or any(p.is_symlink() for p in destination.parents if p != self.conf_dir.parent)
            previous_matches = old and destination.is_file() and not custom_link and destination.read_bytes() == old.read_bytes()
            if new:
                if not os.path.lexists(str(destination)) or previous_matches:
                    tx.write(destination, new.read_bytes())
                elif destination.is_file() and not custom_link and destination.read_bytes() == new.read_bytes():
                    pass
                else:
                    candidate = self.prefix / "config-updates" / self.run_id / relative
                    tx.write(candidate, new.read_bytes())
                    conflicts.append(str(relative))
            elif previous_matches:
                tx.remove(destination)
        return conflicts

    def environment(self, tx):
        directory = shlex.quote(str(self.bin_dir))
        env_path = self.prefix / "env.sh"
        text = '# BaneWfn 命令路径\ncase ":$PATH:" in\n  *:' + directory + ':*) ;;\n  *) export PATH=' + directory + ':"$PATH" ;;\nesac\n'
        tx.write(env_path, text.encode("utf-8"))
        if self.profile:
            original = self.profile.read_text(encoding="utf-8") if self.profile.is_file() else ""
            if original.count(BEGIN) != original.count(END):
                raise InstallError("shell 启动文件中的 BaneWfn 标记不完整，请先检查：" + str(self.profile))
            source = shlex.quote(str(env_path))
            block = BEGIN + "\nif [ -f " + source + " ]; then\n    . " + source + "\nfi\n" + END
            if BEGIN in original:
                result = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), lambda _: block, original, flags=re.S)
            else:
                result = original + ("\n" if original and not original.endswith("\n") else "") + "\n" + block + "\n"
            tx.write(self.profile, result.encode("utf-8"), self.profile.stat().st_mode & 0o777 if self.profile.is_file() else 0o644)

    def run(self):
        if platform.system() != "Linux" or platform.machine() not in ("x86_64", "amd64"):
            raise InstallError("目前支持 Linux / WSL 的 x86_64 环境。Windows 请使用软件主页中的安装器。")
        missing = [name for name in ("curl", "bash", "tar", "gzip") if not shutil.which(name)]
        if missing:
            raise InstallError("缺少安装工具 {}，请先通过系统包管理器安装。".format(", ".join(missing)))
        self.configure()
        import fcntl
        self.config_root.mkdir(parents=True, exist_ok=True)
        with (self.config_root / "install.lock").open("a") as lock:
            try:
                fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise InstallError("另一个 BaneWfn 安装或更新正在运行。")
            self.prefix.mkdir(parents=True, exist_ok=True)
            self.stage = Path(tempfile.mkdtemp(prefix=".install-", dir=str(self.prefix)))
            try:
                current = self.current_package("current")
                self.check_command_links()
                if self.args.rollback:
                    package = self.current_package("previous")
                    if package is None:
                        raise InstallError("没有可回退的上一版本。")
                    metadata = self.read_json(package / ".release.json")
                    self.verify_package(package, metadata)
                else:
                    metadata = self.release()
                    package = self.prepare_package(metadata)
                tx = Transaction(self.prefix / "backups" / self.run_id)
                try:
                    conflicts = self.merge_modules(tx, current, package)
                    if self.write_rc:
                        tx.write(self.rc.resolve(), updated_rc(self.rc, self.settings), 0o600)
                    self.environment(tx)
                    for name in ("banewfn", "bwpack"):
                        tx.link(self.bin_dir / name, self.prefix / "current/bin" / name)
                    state = {"prefix": str(self.prefix), "bin_dir": str(self.bin_dir), "conf_dir": str(self.conf_dir),
                             "profile": str(self.profile) if self.profile else None}
                    tx.write(self.registry_path, json.dumps(state, ensure_ascii=False, indent=2).encode("utf-8"), 0o600)
                    if current and current != package:
                        tx.link(self.prefix / "previous", current)
                    # Switch the executable directory only after configuration and links are ready.
                    tx.link(self.prefix / "current", package)
                except BaseException:
                    tx.rollback()
                    raise
                action = "已是当前版本" if current == package else ("已回退到" if self.args.rollback else "已安装")
                print("{} BaneWfn {}（Release {}）".format(action, metadata["version"], metadata["tag"]))
                print("命令目录：" + str(self.bin_dir))
                print("运行配置：" + str(self.rc))
                print("模块配置：" + str(self.conf_dir))
                print("当前终端生效：. " + shlex.quote(str(self.prefix / "env.sh")))
                if self.profile:
                    print("新终端将通过 {} 加载 PATH。".format(self.profile))
                if conflicts:
                    print("保留了 {} 个自定义模块；官方文件供比较：{}".format(len(conflicts), self.prefix / "config-updates" / self.run_id))
                if tx.entries:
                    print("本次文件备份：" + str(tx.backup))
                if self.missing_multiwfn:
                    print("Multiwfn 尚未找到，准备好后可用 --configure 调整路径。")
            finally:
                shutil.rmtree(str(self.stage))
        if self.tty:
            self.tty.close()
            self.tty_output.close()


def main():
    parser = argparse.ArgumentParser(description="安装或更新 BaneWfn，默认使用最新正式 Release。首次安装通过终端配置资源和环境。")
    channel = parser.add_mutually_exclusive_group()
    channel.add_argument("--prerelease", action="store_true", help="使用最新 prerelease")
    channel.add_argument("--tag", help="使用指定 Release 标签")
    channel.add_argument("--rollback", action="store_true", help="回退到上一已安装版本")
    parser.add_argument("--prefix", help="程序安装目录")
    parser.add_argument("--bin-dir", help="命令入口目录")
    parser.add_argument("--configure", action="store_true", help="重新配置资源和环境")
    parser.add_argument("--multiwfn", help="Multiwfn 路径或命令名")
    parser.add_argument("--cores", type=int, help="默认核心数")
    parser.add_argument("--conf-dir", help="模块配置目录")
    parser.add_argument("--profile", help="写入 PATH 的 shell 启动文件")
    parser.add_argument("--no-profile", action="store_true", help="不修改 shell 启动文件")
    parser.add_argument("--yes", action="store_true", help="不交互，使用参数及默认设置；保留已有命令文件")
    args = parser.parse_args()
    if args.profile and args.no_profile:
        parser.error("--profile 和 --no-profile 不能同时使用")
    try:
        Installer(args).run()
        return 0
    except (InstallError, OSError, ValueError, subprocess.TimeoutExpired) as error:
        print("BaneWfn 安装未完成：" + str(error), file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("BaneWfn 安装已取消。", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
BANEWFN_PYTHON
}

banewfn_install "$@"
