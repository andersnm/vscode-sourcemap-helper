import * as assert from 'assert';
import * as vscode from 'vscode';

suite("Uri sanity checks", () => {

    test("Uri parse with custom scheme and fragment", () => {
        let uri = vscode.Uri.parse("my-uri:test/hello;key=value,content");
        assert.equal(uri.scheme, "my-uri");
        assert.equal(uri.path, "test/hello;key=value,content");
    });

    test("Uri parse inline", () => {
        let uri = vscode.Uri.parse("data:application/json;charset=utf-8;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJtaW4uanMiLAogICJuYW1lcyI6IFsiYmFyIiwgImJheiIsICJuIl0sCiAgInNvdXJjZXMiOiBbIm9uZS5qcyIsICJ0d28uanMiXSwKICAic291cmNlUm9vdCI6ICIuLi9mbGF0IiwKICAibWFwcGluZ3MiOgogICAgIkNBQUMsSUFBSSxJQUFNLFNBQVVBLEdBQ2xCLE9BQU9DLElBQUlEO0NDRGIsSUFBSSxJQUFNLFNBQVVFLEdBQ2xCLE9BQU9BIgp9");
        assert.equal(uri.scheme, "data");
        assert.equal(uri.path, "application/json;charset=utf-8;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJtaW4uanMiLAogICJuYW1lcyI6IFsiYmFyIiwgImJheiIsICJuIl0sCiAgInNvdXJjZXMiOiBbIm9uZS5qcyIsICJ0d28uanMiXSwKICAic291cmNlUm9vdCI6ICIuLi9mbGF0IiwKICAibWFwcGluZ3MiOgogICAgIkNBQUMsSUFBSSxJQUFNLFNBQVVBLEdBQ2xCLE9BQU9DLElBQUlEO0NDRGIsSUFBSSxJQUFNLFNBQVVFLEdBQ2xCLE9BQU9BIgp9");

    });

    test("Uri.file() with Windows path with backslash", () => {
        // Observation: Normalizes drive letter and slashes on Windows, not other OS
        let uri = vscode.Uri.file("C:\\test\\file.txt")
        if (process.platform === "win32") {
            assert.equal("file:///c:/test/file.txt", uri.toString(true));
        } else {
            assert.equal("file:///c:\\test\\file.txt", uri.toString(true));
        }
    });

    test("Uri.file() with Windows path with frontslash", () => {
        // Observation: Allows slashes, normalizes drive letter
        let uri = vscode.Uri.file("C:/test/file.txt")
        assert.equal("file:///c:/test/file.txt", uri.toString(true));
    });

    test("Uri.file() with Windows path and '..'", () => {
        // Observation: Not normalize paths in file() constructor
        let uri = vscode.Uri.file("C:/test/../file.txt")
        assert.equal("file:///c:/test/../file.txt", uri.toString(true));
    });

    test("Uri.parse() with Windows path and '..'", () => {
        // Observation: Not normalize paths in parse() constructor
        let uri = vscode.Uri.parse("file:///C:/test/../file.txt")
        assert.equal("file:///c:/test/../file.txt", uri.toString(true));
    });

    test("Uri.parse() with incorrect two-slash Windows path", () => {
        // Observation: "C:" becomes the authority, fsPath resolves UNC-path to "C:" host on Windows
        let uri = vscode.Uri.parse("file://C:/test/dir/file.txt")
        assert.equal("C:", uri.authority);
        assert.equal("/test/dir/file.txt", uri.path, "path");
        
        if (process.platform === "win32") {
            assert.equal("\\\\C:\\test\\dir\\file.txt", uri.fsPath, "fsPath");
        } else {
            assert.equal("//C:/test/dir/file.txt", uri.fsPath, "fsPath");
        }

        assert.equal("file://c:/test/dir/file.txt", uri.toString(true));
    })

    test("Uri.parse() with three-slash Windows path", () => {
        // Observation: Windows paths get a slash in front, fsPath trims and converts slashes
        let uri = vscode.Uri.parse("file:///C:/test/dir/file.txt")
        assert.equal("", uri.authority, "authority");
        assert.equal("/C:/test/dir/file.txt", uri.path, "path");

        if (process.platform === "win32") {
            assert.equal("c:\\test\\dir\\file.txt", uri.fsPath, "fsPath");
        } else {
            assert.equal("c:/test/dir/file.txt", uri.fsPath, "fsPath");
        }

        assert.equal("file:///c:/test/dir/file.txt", uri.toString(true));
    })

    test("Uri.file() with relative path", () => {
        // Observation: path is treated as absolute
        let uri = vscode.Uri.file("dir/file.txt")
        assert.equal("", uri.authority, "authority");
        assert.equal("/dir/file.txt", uri.path, "path");

        if (process.platform === "win32") {
            assert.equal("\\dir\\file.txt", uri.fsPath, "fsPath");
        } else {
            assert.equal("/dir/file.txt", uri.fsPath, "fsPath");
        }

        assert.equal("file:///dir/file.txt", uri.toString(true));
    });
});
