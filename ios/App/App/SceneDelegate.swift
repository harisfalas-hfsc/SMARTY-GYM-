import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = .black
        let bridgeViewController = CAPBridgeViewController()
        bridgeViewController.view.backgroundColor = .black
        bridgeViewController.bridgedWebView?.isOpaque = true
        bridgeViewController.bridgedWebView?.backgroundColor = .black
        bridgeViewController.bridgedWebView?.scrollView.backgroundColor = .black
        if #available(iOS 15.0, *) {
            bridgeViewController.bridgedWebView?.underPageBackgroundColor = .black
        }
        window?.rootViewController = bridgeViewController
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
