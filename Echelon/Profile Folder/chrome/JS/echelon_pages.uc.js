// ==UserScript==
// @name			Echelon :: About Pages
// @description 	Manages the custom about: pages of Echelon.
// @author			aubymori, ephemeralViolette
// @include			main
// @backgroundmodule
// ==/UserScript==

class OverrideObject
{
    _uri = null;
    QueryInterface = null;

    constructor(uri)
    {
        this._uri = uri;
        this.QueryInterface = ChromeUtils.generateQI(["nsIAboutModule"]);
    }

    get uri()
    {
        return Services.io.newURI(this._uri);
    }

    newChannel(uri, loadInfo)
    {
        const ch = Services.io.newChannelFromURIWithLoadInfo(this.uri, loadInfo);
        ch.owner = Services.scriptSecurityManager.getSystemPrincipal();
        return ch;
    }

    getURIFlags(uri)
    {
        return Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.IS_SECURE_CHROME_UI;
    }

    getChromeURI(_uri)
    {
        return this.uri;
    }
}

class OverrideFactory
{
    QueryInterface = null;
    uri = null;

    constructor(uri)
    {
        this.uri = uri;
        this.QueryInterface = ChromeUtils.generateQI(["nsIFactory"]);
    }

    createInstance(aIID)
    {
        return (new OverrideObject(this.uri)).QueryInterface(aIID);
    }
}

class EchelonPageManager
{
    static registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    static registeredPages = {};

    /* Generate unique ID every launch */
    static generateFreeCID()
    {
        let uuid;
        do
        {
            uuid = Components.ID(Services.uuid.generateUUID().toString());
        }
        while (this.registrar.isCIDRegistered(uuid));

        return uuid;
    }

    static registerAboutPage(name, uri)
    {
        /* Unregister the page if it has already been registered. */
        this.unregisterAboutPage(name);

        let factory = new OverrideFactory(uri);
        let cid = this.generateFreeCID();

        this.registeredPages[name] = {
            cid: cid,
            factory: factory
        };

        this.registrar.registerFactory(
            cid,
            `about:${name}`,
            `@mozilla.org/network/protocol/about;1?what=${name}`,
            factory
        );
    }

    static unregisterAboutPage(name)
    {
        if (this.registeredPages[name])
        {
            this.registrar.unregisterFactory(
                this.registeredPages[name].cid,
                this.registeredPages[name].factory
            );
            delete this.registeredPages[name];
        }
    }
}

EchelonPageManager.registerAboutPage(
    "newtab",
    "chrome://userchrome/content/pages/aboutHome/_aboutHome.html"
);
EchelonPageManager.registerAboutPage(
    "home",
    "chrome://userchrome/content/pages/aboutHome/_aboutHome.html"
);
EchelonPageManager.registerAboutPage(
    "privatebrowsing",
    "chrome://userchrome/content/pages/privateBrowsing/_privateBrowsing.xhtml"
);

let EXPORTED_SYMBOLS = [];