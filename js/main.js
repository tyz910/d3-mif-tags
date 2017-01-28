var uni;

d3.json("data.json", function (data) {
    var mobi = isMobile();
    var safari = isSafari();

    var body = d3.select('body');
    if (mobi) {
        body.classed('svg-optimize', true);
    }
    if (!mobi && !safari) {
        body.classed('with-glow', true);
    }

    uni = new Universe(d3.select('#graph_wrapper'), data, {
        "forceStop": mobi,
        "forceStartTimeout": mobi ? 2000 : 500,
        "visibilityControl": mobi
    });

    uni.addSpecial(new AstroCatSpecialNode());
    uni.addSpecial(new TardisSpecialNode());
    uni.addSpecial(new DeathStarSpecialNode());
    uni.addSpecial(new FuturamaSpecialNode());
    uni.addSpecial(new PonySpecialNode());

    uni.bigBang();
});

function isMobile() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch(e){
        return false;
    }
}

function isSafari() {
    return (navigator.userAgent.indexOf('Safari') != -1) && (navigator.userAgent.indexOf('Chrome') == -1);
}
