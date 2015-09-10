/**
 * Created by Jimmy on 15/9/9.
 */
'use strict';

var volumeChart = dc.barChart('#year-volume-chart');

d3.csv('content/mrtStations.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    var dateFormat = d3.time.format('%Y/%m/%d');
    var numberFormat = d3.format('.2f');

    data.forEach(function (d) {
        d.dd = dateFormat.parse(d.Date);
        d.year = d3.time.year(d.dd);
        d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        d.out = +d.out; // coerce to number
        d.in = +d.in;
    });

    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    // Dimension by month
    var volumeYears = ndx.dimension(function (d) {
        return d.station;
    });
    // Group by total movement within month
    var volumeYearsGroup = volumeYears.group().reduceSum(function (d) {
        return d.in + d.out;
    });

    volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(240)
        .margins({top: 0, right: 50, bottom: 20, left: 40})
        .dimension(volumeYears)
        .group(volumeYearsGroup)
        .centerBar(false)q
        .gap(1)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal);

    dc.renderAll();
});