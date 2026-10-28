// The WebKit half of the language check (tools/lang-check/README.md).
//
// Safari and every iPhone browser draw text with WebKit, and headless Chrome does not, so a line box that fits in Chrome can
// still cut a Thai tone mark in Safari. This machine has Safari 18.6 but no Xcode, no iOS Simulator and no permission to
// switch on Safari's Remote Automation, so this is a 100-line Cocoa program: a WKWebView (the engine Safari and the iOS
// wrapper use) that loads the served app, runs the same in-page script as the Chrome driver (page.js) and prints the same
// measurements as JSON lines. It uses macOS's fonts, not iOS's, so it shows WebKit's layout, not an iPhone's glyphs.
//
//   swiftc -O tools/lang-check/webkit.swift -o ~/Library/Caches/mk-lang-check/webkit-check
//   ~/Library/Caches/mk-lang-check/webkit-check http://127.0.0.1:8751 th '#home,#sos' [--checks tight,clip,over,glyph,break] [--shots DIR] [--width 375] [--page tools/lang-check/page.js] [--eval FILE]
//
// Output: one JSON object per route on stdout ({route, hidden, layout}); with --shots, also DIR/<lang>-<route>.png.
import Cocoa
import WebKit

let args = CommandLine.arguments
if args.count < 4 {
    FileHandle.standardError.write("usage: webkit-check BASE LANG ROUTES [--checks a,b] [--shots DIR] [--width N] [--page FILE]\n".data(using: .utf8)!)
    exit(2)
}
let base = args[1], lang = args[2]
let routes = args[3].split(separator: ",").map(String.init)
func opt(_ name: String) -> String? { if let i = args.firstIndex(of: name), i + 1 < args.count { return args[i + 1] } else { return nil } }
let checks = opt("--checks")?.split(separator: ",").map(String.init)
let shotDir = opt("--shots")
let width = CGFloat(Double(opt("--width") ?? "375") ?? 375)
let pageJS = try! String(contentsOfFile: opt("--page") ?? "tools/lang-check/page.js", encoding: .utf8)

final class Runner: NSObject, WKNavigationDelegate {
    let web: WKWebView
    let window: NSWindow
    var loaded = false
    override init() {
        let cfg = WKWebViewConfiguration()
        web = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: 812), configuration: cfg)
        window = NSWindow(contentRect: NSRect(x: 40, y: 40, width: width, height: 812), styleMask: [.borderless], backing: .buffered, defer: false)
        super.init()
        web.navigationDelegate = self
        window.contentView = web
        window.alphaValue = 0.01          // on screen (so the page counts as visible and has layout) but not in the way
        window.orderFrontRegardless()
    }
    func webView(_ w: WKWebView, didFinish n: WKNavigation!) { loaded = true }
    func spin(_ seconds: Double) { RunLoop.current.run(until: Date(timeIntervalSinceNow: seconds)) }
    func waitFor(_ js: String, _ timeout: Double) -> Bool {
        let end = Date(timeIntervalSinceNow: timeout)
        while Date() < end {
            var done = false, ok = false
            web.evaluateJavaScript(js) { r, _ in ok = (r as? Bool) ?? false; done = true }
            while !done { spin(0.02) }
            if ok { return true }
            spin(0.15)
        }
        return false
    }
    func call(_ body: String, _ timeout: Double = 90) -> String? {
        var done = false, out: String? = nil
        web.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page) { res in
            if case .success(let v) = res { out = v as? String } else if case .failure(let e) = res { out = "{\"error\":\"\(e.localizedDescription)\"}" }
            done = true
        }
        let end = Date(timeIntervalSinceNow: timeout)
        while !done && Date() < end { spin(0.02) }
        return out
    }
    func shot(_ path: String) {
        var done = false
        let cfg = WKSnapshotConfiguration()
        web.takeSnapshot(with: cfg) { img, _ in
            if let img = img, let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff), let png = rep.representation(using: .png, properties: [:]) {
                try? png.write(to: URL(fileURLWithPath: path))
            }
            done = true
        }
        while !done { spin(0.02) }
    }
}

_ = NSApplication.shared
NSApp.setActivationPolicy(.accessory)
let r = Runner()
r.web.load(URLRequest(url: URL(string: base + "/#home")!))
let ready = r.waitFor("document.readyState === 'complete' && !!document.querySelector('#app .screen')", 120)
if !ready { FileHandle.standardError.write("page did not load\n".data(using: .utf8)!); exit(1) }
r.spin(1.5)
var ok = false, done = false
r.web.evaluateJavaScript(pageJS) { v, e in ok = (v as? Bool) ?? false; if let e = e { FileHandle.standardError.write("page.js: \(e)\n".data(using: .utf8)!) }; done = true }
while !done { r.spin(0.02) }
if !ok { exit(1) }
_ = r.call("return JSON.stringify(await __lc.setLang('\(lang)', false));")
// --eval FILE: run a script (an async function body that returns a string) in the page and print what it returns, instead of the routes.
if let f = opt("--eval") {
    let body = try! String(contentsOfFile: f, encoding: .utf8)
    print(r.call(body, 180) ?? "{}")
    exit(0)
}
if let d = shotDir { try? FileManager.default.createDirectory(atPath: d, withIntermediateDirectories: true) }
let checksJS = checks.map { "[" + $0.map { "'\($0)'" }.joined(separator: ",") + "]" } ?? "null"
for route in routes {
    let v = r.call("return JSON.stringify(await __lc.visit('\(route)'));", 60) ?? "{}"
    r.spin(0.4)
    let l = r.call("return JSON.stringify(__lc.layout('\(lang)', \(checksJS)));", 90) ?? "{}"
    print("{\"route\":\"\(route)\",\"visit\":\(v),\"layout\":\(l)}")
    fflush(stdout)
    if let d = shotDir { r.shot("\(d)/\(lang)-\(route.replacingOccurrences(of: "#", with: "")).png") }
}
exit(0)
