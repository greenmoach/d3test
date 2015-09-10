/**
 * Created by Jimmy on 15/9/9.
 */
'use strict';

var yearChart = dc.rowChart('#year-chart');
var volumeChart = dc.barChart('#year-volume-chart');
var monthChart = dc.pieChart('#month-chart');

d3.csv('content/MRTBannanLine.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    var dateFormat = d3.time.format('%Y/%m/%d');
    var numberFormat = d3.format('.2f');

    data.forEach(function (d) {
        d.dd = dateFormat.parse(d.Date);
        d.year = d3.time.year(d.dd);
        d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        d.out = +d.Out; // coerce to number
        d.in = +d.In;
    });

    var ndx = crossfilter(data);
    var all = ndx.groupAll();


    var volumeOfStation = ndx.dimension(function (d) {
        return d.Station;
    });

    var volumeOfInStationGroup = volumeOfStation.group().reduceSum(function (d) {
        return d.in ;
    });
    var volumeOfOutStationGroup = volumeOfStation.group().reduceSum(function (d) {
        return d.out;
    });

    var year = ndx.dimension(function (d) {
        var year = d.dd.getFullYear();
        return year;
    });
    var yearGroup = year.group().reduceSum(function (d) {
        return d.in + d.out;
    });


    var month = ndx.dimension(function (d) {
        var month = d.dd.getMonth();
        return (month + 1) + '月';
    });

    var monthGroup = month.group().reduceSum(function (d) {
        return d.in + d.out;
    });


    volumeChart.width(1090) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(240)
        .margins({top: 40, right: 50, bottom: 20, left: 80})
        .dimension(volumeOfStation)
        .group(volumeOfInStationGroup, "進站人次")
        .centerBar(false)
        .gap(1)
        .elasticY(true)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .valueAccessor(function (d) {
            return d.value;
        })
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
        .stack(volumeOfOutStationGroup, '出站人次', function (d) {
            return d.value;
        });


    yearChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
        .width(380)
        .height(280)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(yearGroup)
        .dimension(year)
        // Assign colors to each value in the x scale domain
        .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
        .label(function (d) {
            return d.key;
        })
        // Title sets the row text
        .title(function (d) {
            return d.value;
        })
        .elasticX(true)
        .xAxis().ticks(4);

    monthChart /* dc.pieChart('#month-chart', 'chartGroup') */
        .width(280)
        .height(280)
        .radius(100)
        .innerRadius(30)
        .dimension(month)
        .group(monthGroup);

    dc.renderAll();
});