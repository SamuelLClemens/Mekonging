//
//  ContentView.swift
//  Mekonging
//
//  Hosts the bundled web app in a full-screen WKWebView. The app is served from the
//  "Web" folder reference over a private "mekong://" scheme (a stable origin that lets
//  localStorage / IndexedDB persist and lets relative asset paths resolve), so the
//  experience is identical to the web build but works entirely offline on-device.
//

import SwiftUI
import WebKit
import UIKit

// Private scheme used to serve the bundled web app. Must NOT be a standard scheme.
private let appScheme = "mekong"
private let appHost = "app"
private let webFolderName = "Web"   // folder reference added to the app target

// App background (matches the web --cream token) so safe-area strips look intentional.
private let creamUIColor = UIColor(red: 0.969, green: 0.918, blue: 0.816, alpha: 1)

// Schemes we are willing to hand off to the system (matches the web app's link types).
private let externalSchemes: Set<String> = [
    "http", "https", "tel", "mailto", "sms", "facetime", "maps", "geo", "itms-apps", "comgooglemaps",
]

struct ContentView: View {
    var body: some View {
        ZStack {
            Color(creamUIColor).ignoresSafeArea()
            // Respect the top safe area (the web top bar sits below the status bar / notch),
            // but extend under the home indicator — the web tab bar already pads
            // env(safe-area-inset-bottom), so this keeps a single source of bottom inset.
            WebView().ignoresSafeArea(.container, edges: .bottom)
        }
    }
}

// MARK: - WKWebView host

struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(WebSchemeHandler(), forURLScheme: appScheme)
        config.websiteDataStore = .default()                 // persist localStorage + IndexedDB
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = [] // let text-to-speech audio play

        let pagePrefs = WKWebpagePreferences()
        pagePrefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = pagePrefs

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = creamUIColor
        webView.scrollView.backgroundColor = creamUIColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.allowsLinkPreview = false
        webView.scrollView.bounces = true
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator

        // Load the bundled app, or a clear setup page if the Web folder was not added.
        let webRoot = Bundle.main.resourceURL?.appendingPathComponent(webFolderName)
        let indexExists = webRoot.map { FileManager.default.fileExists(atPath: $0.appendingPathComponent("index.html").path) } ?? false
        if indexExists, let start = URL(string: "\(appScheme)://\(appHost)/index.html") {
            webView.load(URLRequest(url: start))
        } else {
            webView.loadHTMLString(Self.setupHelpHTML, baseURL: nil)
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) { }

    func makeCoordinator() -> Coordinator { Coordinator() }

    // Shown only if the "Web" folder reference is missing from the target — turns an
    // otherwise-blank screen into an actionable message.
    static let setupHelpHTML = """
    <!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body{font:-apple-system-body;margin:0;background:#F7EAD0;color:#3A2415;
    display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
    div{max-width:30em}h1{color:#CC5500}code{background:#FFF6E2;padding:2px 6px;border-radius:6px}</style></head>
    <body><div><h1>Web assets not bundled</h1>
    <p>The app shell loaded, but the <code>Web</code> folder is not in the app target.</p>
    <p>Run <code>sync-web.sh</code>, then in Xcode add the <b>Web</b> folder as a <b>folder reference</b>
    (blue folder, &ldquo;Create folder references&rdquo;) to the Mekonging target and rebuild.</p></div></body></html>
    """
}

// MARK: - Navigation + UI delegate

/// Routes external links (maps, booking, photo search), phone calls (SOS) and
/// new-window (target="_blank") requests out to the system, and bridges the web app's
/// JavaScript alert/confirm/prompt dialogs to native UIAlertControllers — without these
/// a bare WKWebView silently ignores them.
final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {

    // In-app links use the mekong:// scheme (including hash navigation). Anything else —
    // tel:, mailto:, maps:, geo:, http(s) — is an external destination handed to the system.
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.allow); return }
        if url.scheme == appScheme || url.scheme == "about" {
            decisionHandler(.allow)
            return
        }
        openExternally(url)
        decisionHandler(.cancel)
    }

    // target="_blank" / window.open: open externally, do not create an in-app window.
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { openExternally(url) }
        return nil
    }

    // Only hand known, expected schemes to the system; ignore anything else.
    private func openExternally(_ url: URL) {
        guard let scheme = url.scheme?.lowercased(), externalSchemes.contains(scheme) else { return }
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }

    // MARK: JavaScript dialog bridges
    //
    // Each WebKit completion handler MUST be called exactly once: a missed call hangs the
    // page, a double call crashes. We wrap every handler in a fire-once guard and feed it
    // from exactly one of two mutually exclusive paths — a button tap, or the
    // present-failure fallback.

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let done = fireOnce(completionHandler)
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in done() })
        present(alert, from: webView, fallback: done)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let done = fireOnce(completionHandler)
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in done(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in done(true) })
        present(alert, from: webView, fallback: { done(false) })
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let done = fireOnce(completionHandler)
        let alert = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        alert.addTextField { $0.text = defaultText }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in done(nil) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak alert] _ in
            done(alert?.textFields?.first?.text)
        })
        present(alert, from: webView, fallback: { done(nil) })
    }

    // Present from the web view's owning, on-screen view controller. If presentation is
    // impossible (no window, mid-transition, no responder), invoke the fallback so the
    // WebKit completion handler is never left dangling.
    private func present(_ alert: UIAlertController, from webView: WKWebView, fallback: @escaping () -> Void) {
        var responder: UIResponder? = webView
        while let r = responder, !(r is UIViewController) { responder = r.next }
        guard let base = responder as? UIViewController, base.viewIfLoaded?.window != nil else {
            fallback(); return
        }
        var top = base
        while let presented = top.presentedViewController { top = presented }
        guard !top.isBeingPresented, !top.isBeingDismissed else { fallback(); return }
        top.present(alert, animated: true)
    }

    // Fire-once wrappers (overloaded by arity) — calling the result more than once is a no-op.
    private func fireOnce(_ handler: @escaping () -> Void) -> () -> Void {
        let lock = NSLock(); var called = false
        return { lock.lock(); let go = !called; called = true; lock.unlock(); if go { handler() } }
    }
    private func fireOnce<T>(_ handler: @escaping (T) -> Void) -> (T) -> Void {
        let lock = NSLock(); var called = false
        return { v in lock.lock(); let go = !called; called = true; lock.unlock(); if go { handler(v) } }
    }
}

// MARK: - Bundled-asset scheme handler

/// Serves files from the bundled "Web" folder in response to mekong://app/<path>
/// requests. File reads happen off the main thread; results are delivered ON the main
/// thread, where WebKit also delivers stop:, so the stopped-check and the task callbacks
/// cannot interleave — avoiding the "method called after stop" exception.
final class WebSchemeHandler: NSObject, WKURLSchemeHandler {
    private let ioQueue = DispatchQueue(label: "mekong.web.scheme.io", qos: .userInitiated, attributes: .concurrent)
    private var stopped = Set<ObjectIdentifier>()   // touched only on the main thread

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        let id = ObjectIdentifier(task)
        stopped.remove(id)

        guard let requestURL = task.request.url else {
            task.didFailWithError(URLError(.badURL)); return
        }

        // mekong://app/<path>  ->  <bundle>/Web/<path> ; default to index.html.
        var relativePath = requestURL.path
        if relativePath.hasPrefix("/") { relativePath.removeFirst() }
        if relativePath.isEmpty { relativePath = "index.html" }

        ioQueue.async { [weak self] in
            guard let self = self else { return }

            var response: HTTPURLResponse
            var body = Data()

            if let baseURL = Bundle.main.resourceURL?.appendingPathComponent(webFolderName).standardizedFileURL,
               case let fileURL = baseURL.appendingPathComponent(relativePath).standardizedFileURL,
               WebSchemeHandler.isContained(fileURL, in: baseURL),
               let data = try? Data(contentsOf: fileURL) {
                body = data
                response = HTTPURLResponse(url: requestURL, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
                    "Content-Type": WebSchemeHandler.mimeType(forExtension: fileURL.pathExtension),
                    "Content-Length": String(data.count),
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                ])!
            } else {
                response = HTTPURLResponse(url: requestURL, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            }

            // Deliver on the main thread; stop: also arrives on main, so checking `stopped`
            // and then synchronously calling the task methods cannot be interrupted by stop:.
            DispatchQueue.main.async {
                if self.stopped.contains(id) { return }
                task.didReceive(response)
                task.didReceive(body)
                task.didFinish()
            }
        }
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        stopped.insert(ObjectIdentifier(task))
    }

    // True only if `fileURL` is the base directory itself or a descendant of it.
    // Compares against a separator-terminated base so sibling dirs sharing a prefix do not pass.
    static func isContained(_ fileURL: URL, in baseURL: URL) -> Bool {
        if fileURL.path == baseURL.path { return true }
        let basePrefix = baseURL.path.hasSuffix("/") ? baseURL.path : baseURL.path + "/"
        return fileURL.path.hasPrefix(basePrefix)
    }

    static func mimeType(forExtension ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm":     return "text/html; charset=utf-8"
        case "js", "mjs":       return "text/javascript; charset=utf-8"
        case "css":             return "text/css; charset=utf-8"
        case "json", "geojson": return "application/json; charset=utf-8"
        case "webmanifest":     return "application/manifest+json; charset=utf-8"
        case "svg":             return "image/svg+xml"
        case "png":             return "image/png"
        case "jpg", "jpeg":     return "image/jpeg"
        case "webp":            return "image/webp"
        case "gif":             return "image/gif"
        case "ico":             return "image/x-icon"
        case "woff2":           return "font/woff2"
        case "woff":            return "font/woff"
        case "ttf":             return "font/ttf"
        case "txt":             return "text/plain; charset=utf-8"
        default:                return "application/octet-stream"
        }
    }
}
