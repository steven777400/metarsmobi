// ** (c) Steve Kollmansberger, 2014

var baseUrl = '//metars.mobi/';
var searched = false;
var KM_TO_NM = 0.539957;




function getMETARsAndTAFs(murl, turl) {
    return $.ajax(turl).pipe(function (turlData) {
        return $.ajax(murl).pipe(function (murlData) {
            return {
                'METARs': murlData,
                'TAFs': turlData
            };
        });
    });
}

function getMETARsAndTAFsForIdents(idents) {
    var murl = baseUrl + 'metars.php?ds=metars&idents=' + idents.join();
    var turl = baseUrl + 'metars.php?ds=tafs&idents=' + idents.join();
    return getMETARsAndTAFs(murl, turl);

}

function getMETARsAndTAFsForLoc(lat, lon) {
    var murl = baseUrl + 'metars.php?ds=metars&loc=' + lon + ',' + lat;
    var turl = baseUrl + 'metars.php?ds=tafs&loc=' + lon + ',' + lat;
    return getMETARsAndTAFs(murl, turl);
}

// applies a regex to a string.  Each match, function f
// is given the matching portion, and expected to return
// an object containing before and after, strings which will be appended
// before and after, respectively.
function adorn(str, regex, f) {


    return str.replace(regex, function repl(match) {
        var fr = f(match);
        return fr.before + match + fr.after;
    });



}

function spancls(cls) {
    if (cls)
        return {
            before: '<span class=' + cls + '>',
            after: '</span>'
        };
    else
        return {
            before: '', after: ''
        };

}

var coverages = ["FEW", "SCT", "BKN", "OVC", "VV"];

function enhance(str, worst, station) {
    // taf: line-breaks for TEMPO and FM and BECMG
    var tafnl = /(TEMPO)|(FM\d+)|(BECMG)|(PROB\d\d)/g;

    str = adorn(str, tafnl, function (m) {
        return { before: '<br /><strong>', after: '</strong>' };
    });

    var vis = /[ ](M|P)?(\d[ ])?(\d\/)?\d+SM/g;
    str = adorn(str, vis, function (m) {
        var cls = "";
        m = m.slice(1); // remove space from front
        var worst_vis = m;

        m = m.slice(0, m.length - 2); // remove SM from end


        var worst_viscode = 0;

        if (m.indexOf('P') > -1) {
            worst_viscode = 100;
            cls = ""; // vfr
        } else if (m.indexOf('M') > -1) {
            worst_viscode = 0.1; // can't use 0, 0 is a falsey value!
            cls = "IFR";
        } else if (m.indexOf('/') > -1) {
            if (m.length == 3)
                worst_viscode = parseInt(m[0], 10) / parseInt(m[2], 10);
            else
                worst_viscode = parseInt(m[0], 10) + parseInt(m[2], 10) / parseInt(m[4], 10);
            cls = "IFR";
        } else {
            var visv = parseInt(m, 10);
            worst_viscode = visv;

            if (visv < 3)
                cls = "IFR";
            else if (visv <= 5)
                cls = "MVFR";
            else if (visv <= 6)
                cls = "QVFR";

        }


        if (worst && (!worst.viscode || worst.viscode > worst_viscode)) {
            worst.vis = worst_vis;
            worst.viscode = worst_viscode;
            worst.visstation = station;
        }

        return spancls(cls);

    });

    var cld = /(FEW|SCT|BKN|OVC|VV)\d{3}/g;
    str = adorn(str, cld, function (m) {
        var cls = "";
        var lvl = parseInt(m.slice(m.length - 3, m.length), 10);
        var coverage = m.slice(0, m.length - 3);

        if (lvl < 20 && coverage === "SCT") {
            cls = "QVFR";
        }

        if (coverage === "OVC" || coverage === "BKN") { // formal ceiling
            if (lvl < 10)
                cls = "IFR";
            else if (lvl <= 30)
                cls = "MVFR";


        }

        if (coverage === "VV")
            cls = "IFR";

        if (worst && (!worst[lvl] || coverages.indexOf(worst[lvl]) < coverages.indexOf(coverage))) {
            worst[lvl] = coverage;
            worst[lvl + "station"] = station;

        }


        return spancls(cls);

    });

    var wnd = /\d{3}\d{2}(G\d{2})?KT/g;
    str = adorn(str, wnd, function (m) {
        var cls = "";
        var ws = 0;
        if (m.indexOf('G') > -1)
            ws = parseInt(m.slice(6, 8), 10);
        else
            ws = parseInt(m.slice(3, 5), 10);

        if (ws >= 20)
            cls = "QVFR";

        if (worst && (!worst.windcode || worst.windcode < ws)) {
            worst.windcode = ws;
            worst.wind = m;
            worst.windstation = station;
        }

        return spancls(cls);

    });

    // pad temp with spaces to avoid catching chunks of the taf hour blocks
    var tempdew = /[ ](M)?\d{2}[/](M)?\d{2}[ ]/g;
    str = adorn(str, tempdew, function (m) {
        var cls = "";
        
        m = m.replace(/M/g, '-');
        var slidx = m.indexOf('/');
        var temp = parseInt(m.slice(0, slidx), 10);
        var dew = parseInt(m.slice(slidx + 1), 10);

        if (temp - dew <= 3)
            cls = "QVFR";

        return spancls(cls);
    });

    return str;
}

function worstCls(str) {
    if (str.indexOf("IFR") > -1)
        return "IFR";
    if (str.indexOf("MVFR") > -1)
        return "MVFR";
    if (str.indexOf("QVFR") > -1)
        return "QVFR";
    return "VFR";
}

function distDir(latlon, origin) {


    var item = {
        distance: origin.distanceTo(latlon) * KM_TO_NM, 
        direction: origin.bearingTo(latlon),
    };
    var dir = "";
    var split = 45 / 2;

    if (item.direction < 45 - split)
        dir = "N";
    else if (item.direction < 90 - split)
        dir = "NE";
    else if (item.direction < 135 - split)
        dir = "E";
    else if (item.direction < 180 - split)
        dir = "SE";
    else if (item.direction < 225 - split)
        dir = "S";
    else if (item.direction < 270 - split)
        dir = "SW";
    else if (item.direction < 315 - split)
        dir = "W";
    else if (item.direction < 360 - split)
        dir = "NW";
    else
        dir = "N";

    return Math.round(item.distance) + " nm " + dir;
}

function buildMETAR(worst) {
    var str = "WORST ";
    if (worst.windstation)
        str += "<span class=worstStation>" + worst.windstation + "</span> ";
    str += worst.wind;
    str += " ";
    if (worst.visstation)
        str += "<span class=worstStation>" + worst.visstation + "</span> ";
    str += worst.vis;
    str += " ";

    var cidx = 0;
    for (var lvl = 1; lvl < 250; lvl++) {
        if (worst[lvl] && cidx <= coverages.indexOf(worst[lvl])) {            

            str += worst[lvl] + ("000" + lvl).slice(-3) + " ";
            if (worst[lvl + "station"])
                str += "<span class='worstStation lvl'>" + worst[lvl + "station"] + "</span> ";

            cidx = coverages.indexOf(worst[lvl]);
            if (worst[lvl] === "OVC" || worst[lvl] === "VV")
                break; // hard ceiling
        }
        
    }


    return str.trim();

}

function formatDate(dt) {

    var hr = dt.getUTCHours();
    var min = dt.getUTCMinutes();

    return ("00" + hr).slice(-2) + ":" + ("00" + min).slice(-2) + " Z";
}

function calculateAge(dt1, dt2) {


    var diff = (dt1.getTime() - dt2.getTime());
    
    if (diff <= 0)
        return "just now"; // future check

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    
    if (hours > 0 && mins >= 30) {
        hours++;
        mins = 0;
    }

    if (hours > 23)
        return "a day or more ago";

    if (hours > 1)
        return "about " + hours + " hours ago";

    if (hours === 1)
        return "about an hour ago";

    if (mins > 1)
        return "about " + mins + " minutes ago";

    if (mins === 1)
        return "about a minute ago";

    return "just now";



}

function locate() {
    viewModel.message("Awaiting GPS Location...");
    viewModel.stations.removeAll();
    viewModel.applyDistanceFilter(true);

    if (navigator.geolocation) {
        searched = false;
        navigator.geolocation.getCurrentPosition(gotPosition);
    } else {
        viewModel.message("Geolocation is not supported by this browser.");
    }
}

function gotPosition(loc) {
    viewModel.myOrigin(new LatLon(loc.coords.latitude, loc.coords.longitude));
    viewModel.message(null);
    if (!searched) {
        loadData(getMETARsAndTAFsForLoc(loc.coords.latitude, loc.coords.longitude));
    }
}

function initData(data) {



    // ARE YOU INSANE.  Service returns array if 2+ objects, but just the object if only 1
    var metararr;
    if (data.METARs.data.METAR instanceof Array)
        metararr = data.METARs.data.METAR;
    else if (!data.METARs.data.METAR) {
        viewModel.message("No results");
        metararr = [];
    } else
        metararr = new Array(data.METARs.data.METAR);

    var tafarr;
    if (data.TAFs.data.TAF instanceof Array)
        tafarr = data.TAFs.data.TAF;
    else if (!data.TAFs.data.TAF)
        tafarr = [];
    else
        tafarr = new Array(data.TAFs.data.TAF);

    viewModel.metararr(metararr);
    viewModel.tafarr(tafarr);

    displayData();
}

function displayData() {

    var worst = {};
    viewModel.stations.removeAll();

    viewModel.metararr().forEach(function (metar) {

        var result = {
            id: metar.station_id,
            metar: metar.raw_text,
            latlon: new LatLon(metar.latitude, metar.longitude),
            sectioncls: ''
        };

        if (viewModel.myOrigin()) {
            result.distance = viewModel.myOrigin().distanceTo(result.latlon) * KM_TO_NM;
        } else {
            result.distance = 0; // not for display, just for sorting
        }

        if (!viewModel.applyDistanceFilter() ||
            result.distance <= viewModel.range()) {

            result.metarHtml = enhance(metar.raw_text, worst, result.id);
            result.metarTime = new Date(metar.observation_time);

            result.flightcls = worstCls(result.metarHtml);

            var tafs = viewModel.tafarr().filter(function (taf) {
                return taf.station_id === metar.station_id;
            });

            if (tafs.length > 0) {
                result.taf = tafs[0].raw_text;
                result.tafTime = new Date(tafs[0].issue_time);
                result.tafHtml = enhance(result.taf);
            }



            viewModel.stations.push(result);
        }

    });

    if (viewModel.stations().length > 1) {

        viewModel.stations().sort(function compare(a, b) {
            if (a.distance < b.distance) return -1;
            else if (a.distance > b.distance) return 1;
            else return 0;
        });

        var worstresult = {
            id: 'WORST',
            metar: buildMETAR(worst),
            metarHtml: enhance(buildMETAR(worst)),
            sectioncls: 'worst'

        };
        worstresult.flightcls = worstCls(worstresult.metarHtml)
        viewModel.stations.unshift(worstresult);

    }
    $('[data-role=collapsible]').collapsible().trigger('create');

}

function loadData(f) {
    searched = true;

    viewModel.stations.removeAll();
    viewModel.loadTime(new Date());

    $.mobile.loading("show", {
        text: "Loading..."
    });

    f.done(initData)
     .fail(function (err) {
         viewModel.loadTime(null);
         viewModel.message("Error loading data - " + JSON.stringify(err));
     })
     .always(function () {
         $.mobile.loading("hide");
     });


}

