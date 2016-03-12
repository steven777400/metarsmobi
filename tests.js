

QUnit.test("worstCls", function (assert) {

    assert.ok(worstCls(enhance(" 10SM CLR")) == "VFR");

    assert.ok(worstCls(enhance(" 10SM CLR 01010KT")) == "VFR");
    assert.ok(worstCls(enhance(" 10SM CLR 01025KT")) == "QVFR");
    assert.ok(worstCls(enhance(" 10SM CLR 01015G25KT")) == "QVFR");

    assert.ok(worstCls(enhance(" 6SM CLR")) == "QVFR");

    assert.ok(worstCls(enhance(" 6SM FEW019")) == "QVFR");
    assert.ok(worstCls(enhance(" 10SM FEW019")) == "VFR");
    assert.ok(worstCls(enhance(" 10SM SCT019")) == "QVFR");

    assert.ok(worstCls(enhance(" 10SM BKN020")) == "MVFR");

    assert.ok(worstCls(enhance(" 10SM BKN040")) == "VFR");
    assert.ok(worstCls(enhance(" 5SM BKN040")) == "MVFR");

    assert.ok(worstCls(enhance(" 2SM BKN040")) == "IFR");
    assert.ok(worstCls(enhance(" 5SM BKN005")) == "IFR");
});

QUnit.test("distance", function (assert) {
    var origin = new LatLon(46.9694044, -122.9025447);

    // KTIW 22 nm NE
    var dest = new LatLon(47.2679444, -122.5781111);
    var dist = distDir(dest, origin);
    assert.ok(dist == "22 nm NE", dist);

    // KCLS 18 nm S
    var dest = new LatLon(46.6770278, -122.9827500);
    var dist = distDir(dest, origin);
    assert.ok(dist == "18 nm S", dist);

});

QUnit.test("worst", function (assert) {
    var worst = {};
    enhance("01005KT 10SM FEW003 SCT007", worst);
    enhance("11015KT 5SM BKN003", worst);
    enhance("09005G10KT 7SM OVC001", worst);

    assert.ok(worst.vis === "5SM", worst.vis);
    assert.ok(worst.wind === "11015KT", worst.wind);
    assert.ok(worst[3] === "BKN", worst[3]);
    assert.ok(worst[1] === "OVC", worst[1]);
    assert.ok(worst[7] === "SCT", worst[7]);

    enhance("09007G16KT 7SM OVC007", worst);
    assert.ok(worst.vis === "5SM", worst.vis);
    assert.ok(worst.wind === "09007G16KT", worst.wind);
    assert.ok(worst[3] === "BKN", worst[3]);
    assert.ok(worst[1] === "OVC", worst[1]);
    assert.ok(worst[7] === "OVC", worst[7]);

    var worst = {};
    enhance("04005KT 9SM", worst);
    enhance("04005KT 1/2SM FG", worst);
    assert.ok(worst.vis === "1/2SM", worst.vis);
    assert.ok(worst.wind === "04005KT", worst.wind);


    var worst = {};
    enhance("04005KT 1/2SM FG", worst);
    enhance("04005KT 9SM", worst);    
    assert.ok(worst.vis === "1/2SM", worst.vis);
    assert.ok(worst.wind === "04005KT", worst.wind);

    var worst = {};
    enhance(" 1/2SM FG", worst);
    enhance(" 1 1/2SM", worst);    
    enhance(" 3/4SM FG", worst);
    enhance(" 2 1/2SM", worst);
    assert.ok(worst.vis === "1/2SM", worst.vis);

    var worst = {};    
    enhance(" 1 1/2SM", worst);
    enhance(" 3/4SM FG", worst);
    enhance(" 2 1/2SM", worst);
    assert.ok(worst.vis === "3/4SM", worst.vis);

    var worst = {};
    enhance(" 1 1/2SM", worst);
    enhance(" M1/4SM FG", worst);
    enhance(" 2 1/2SM", worst);
    assert.ok(worst.vis === "M1/4SM", worst.vis);

    var worst = {};
    enhance(" 1 1/2SM", worst);    
    enhance(" 2 1/2SM", worst);
    assert.ok(worst.vis === "1 1/2SM", worst.vis);
    
    var worst = {}
    enhance("KOLM 021504Z AUTO 27003KT 3SM BR BKN024 OVC060 06/06 A3014 RMK AO2 T00610061", worst);
    enhance("KGRF 021458Z AUTO 14005KT 10SM OVC028 07/07 A3013 RMK AO2 SLP208 T00700069 50005 PWINO $", worst);
    assert.ok(worst.vis === "3SM", worst.vis);
    enhance("KSHN 021524Z AUTO 00000KT 2 1/2SM BR OVC003 05/04 A3011 RMK AO2 VIS 1 1/4V4 T00500044 TSNO $", worst);
    enhance("KGRF 021458Z AUTO 14005KT 10SM OVC028 07/07 A3013 RMK AO2 SLP208 T00700069 50005 PWINO $", worst);
    assert.ok(worst.vis === "2 1/2SM", worst.vis);
    enhance("KGRF 021458Z AUTO 14005KT 10SM OVC028 07/07 A3013 RMK AO2 SLP208 T00700069 50005 PWINO $", worst);
    enhance("KTCM 021533Z AUTO 09002KT 2SM BR BKN031 06/06 A3014 RMK AO2 VIS 1/2V2 $", worst);
    enhance("KGRF 021458Z AUTO 14005KT 10SM OVC028 07/07 A3013 RMK AO2 SLP208 T00700069 50005 PWINO $", worst);
    assert.ok(worst.vis === "2SM", worst.vis);
    enhance("KGRF 021458Z AUTO 14005KT 10SM OVC028 07/07 A3013 RMK AO2 SLP208 T00700069 50005 PWINO $", worst);
    enhance("KPWT 021535Z AUTO 21003KT M1/4SM OVC002 06/06 A3015 RMK AO1", worst);
    enhance("KGRF 021458Z AUTO 14005KT 10SM OVC028 07/07 A3013 RMK AO2 SLP208 T00700069 50005 PWINO $", worst);
    assert.ok(worst.vis === "M1/4SM", worst.vis);
    enhance("KHQM 021506Z AUTO 06004KT 5SM BR SCT014 SCT026 OVC047 08/08 A3011 RMK AO2 T00830078", worst);
    assert.ok(worst.vis === "M1/4SM", worst.vis);


});

QUnit.test("build metar", function (assert) {

    var str = buildMETAR({ wind : '01010KT', vis: '10SM', 90: 'BKN', 5: 'FEW' });
    assert.ok(str == "WORST 01010KT 10SM FEW005 BKN090", str);

    var str = buildMETAR({ wind: '01010G12KT', vis: '10SM' });
    assert.ok(str == "WORST 01010G12KT 10SM", str);

    var str = buildMETAR({ wind: '01010G12KT', vis: '10SM',2: 'VV' });
    assert.ok(str == "WORST 01010G12KT 10SM VV002", str);

    
    var str = buildMETAR({ wind: '01010G12KT', vis: '10SM', 150: 'OVC', 50: 'FEW' });
    assert.ok(str == "WORST 01010G12KT 10SM FEW050 OVC150", str);

    // at same level, prefer lightly coverage followed by heaver coverage
    var str = buildMETAR({ wind: '01010G12KT', vis: '10SM', 70: 'OVC' });
    assert.ok(str == "WORST 01010G12KT 10SM OVC070", str);
   

    // lower cloud levels always preceed higher cloud levels
    var str = buildMETAR({ wind: '01010G12KT', vis: '10SM', 150: 'BKN', 25: 'OVC' });
    assert.ok(str == "WORST 01010G12KT 10SM OVC025", str);

    var str = buildMETAR({ wind: '01010G12KT', vis: '10SM', 150: 'OVC', 25: 'BKN' });
    assert.ok(str == "WORST 01010G12KT 10SM BKN025 OVC150", str);


    // multiple of same kind allowed
    var str = buildMETAR({ wind: '01010KT', vis: '10SM', 20: 'FEW', 30: 'FEW', 45: 'OVC' });
    assert.ok(str == "WORST 01010KT 10SM FEW020 FEW030 OVC045", str);

    // from bottom to top, once a cloud coverage type has appeared, never
    // show a lighter type
    var str = buildMETAR({ wind: '01010KT', vis: '10SM', 70: 'FEW', 150: 'SCT', 25: 'SCT' });
    assert.ok(str == "WORST 01010KT 10SM SCT025 SCT150", str);

    var str = buildMETAR({ wind: '01010KT', vis: '10SM', 70: 'SCT', 150: 'OVC', 25: 'BKN' });
    assert.ok(str == "WORST 01010KT 10SM BKN025 OVC150", str);

    // OVC and VV count as hard ceilings; don't show anything on top of that
    var str = buildMETAR({ wind: '01010KT', vis: '10SM', 70: 'VV', 150: 'OVC', 25: 'OVC' });
    assert.ok(str == "WORST 01010KT 10SM OVC025", str);

    var str = buildMETAR({ wind: '01010KT', vis: '10SM', 70: 'SCT', 150: 'OVC', 25: 'VV' });
    assert.ok(str == "WORST 01010KT 10SM VV025", str);
    

});


QUnit.test("enhance tempdew", function (assert) {
    var str = enhance(" 13/08 ");
    assert.ok(str == " 13/08 ", "13/08");

    var str = enhance(" 13/10 ");
    assert.ok(str == "<span class=QVFR> 13/10 </span>", "13/10");

    var str = enhance(" 02/M02 ");
    assert.ok(str == " 02/M02 ", "02/M02");

    var str = enhance(" 01/M01 ");
    assert.ok(str == "<span class=QVFR> 01/M01 </span>", "01/M01");

    var str = enhance(" M02/M06 ");
    assert.ok(str == " M02/M06 ", "M02/M06");

    var str = enhance(" M04/M06 ");
    assert.ok(str == "<span class=QVFR> M04/M06 </span>", "M04/M06");

    var str = enhance(" 12/11 ");
    assert.ok(str == "<span class=QVFR> 12/11 </span>", "12/11");
});

QUnit.test("enhance vis", function (assert) {
    var str = enhance(" 10SM");
    assert.ok(str == " 10SM", str);

    var str = enhance(" 6SM");
    assert.ok(str == "<span class=QVFR> 6SM</span>", "6SM");

    var str = enhance(" 5SM");
    assert.ok(str == "<span class=MVFR> 5SM</span>", "5SM");

    var str = enhance(" 3SM");
    assert.ok(str == "<span class=MVFR> 3SM</span>", "3SM");

    var str = enhance(" 2SM");
    assert.ok(str == "<span class=IFR> 2SM</span>", "2SM");

    var str = enhance(" 1SM");
    assert.ok(str == "<span class=IFR> 1SM</span>", "1SM");

    var str = enhance(" 1/2SM");
    assert.ok(str == "<span class=IFR> 1/2SM</span>", "1/2SM");

    var str = enhance(" 3/4SM");
    assert.ok(str == "<span class=IFR> 3/4SM</span>", "3/4SM");

    var str = enhance(" 2 1/2SM");
    assert.ok(str == "<span class=IFR> 2 1/2SM</span>", "2 1/2SM");

    var str = enhance(" 1 3/4SM");
    assert.ok(str == "<span class=IFR> 1 3/4SM</span>", "1 3/4SM");

    var str = enhance(" M1/4SM");
    assert.ok(str == "<span class=IFR> M1/4SM</span>", "M1/4SM");

    var str = enhance(" P6SM");
    assert.ok(str == " P6SM", "P6SM");
});




QUnit.test("calculate age", function (assert) {
    var dt = new Date();

    dt.setTime((new Date()).getTime() + 300000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "just now", str);

    dt.setTime((new Date()).getTime() - 30000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "just now", "30 secs");

    dt.setTime((new Date()).getTime() - 80000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about a minute ago", "80 secs");

    dt.setTime((new Date()).getTime() - 200000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about 3 minutes ago", "200 secs");

    dt.setTime((new Date()).getTime() - 50 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about 50 minutes ago", "50 mins");

    dt.setTime((new Date()).getTime() - 60 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about an hour ago", "1 hour");

    dt.setTime((new Date()).getTime() - 80 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about an hour ago", "80 min");

    dt.setTime((new Date()).getTime() - 100 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about 2 hours ago", "100 min");

    dt.setTime((new Date()).getTime() - 130 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "about 2 hours ago", str);

    dt.setTime((new Date()).getTime() - 30 * 60 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "a day or more ago", "30 hour");

    dt.setTime((new Date()).getTime() - 60 * 60 * 60 * 1000);
    var str = calculateAge(new Date(), dt);
    assert.ok(str == "a day or more ago", "60 hour");

});



