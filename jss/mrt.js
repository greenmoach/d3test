/**
 * Created by etapp on 15/9/7.
 */
'use strict';

var yearChart = dc.rowChart('#year-chart');
var quarterChart = dc.pieChart('#quarter-chart');
var monthChart = dc.pieChart('#month-chart');

var moveChart = dc.lineChart('#monthly-move-chart');
var volumeChart = dc.barChart('#monthly-volume-chart');

var inoutChar = dc.compositeChart('#inout-line-chart');
var inChart = dc.lineChart(inoutChar);
var outChart = dc.lineChart(inoutChar);

d3.csv('content/mrtSingleStation.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    var dateFormat = d3.time.format('%Y/%m/%d');
    var numberFormat = d3.format('.2f');

    data.forEach(function (d) {
        d.dd = dateFormat.parse(d.Date);
        d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        d.out = +d.out; // coerce to number
        d.in = +d.in;
    });

    //### Create Crossfilter Dimensions and Groups

    //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
    var ndx = crossfilter(data);
    var all = ndx.groupAll();


    var year = ndx.dimension(function (d) {
        var year = d.dd.getFullYear();
        return year;
    });
    var yearGroup = year.group().reduceSum(function (d) {
        return d.in + d.out;
    });

    var quarter = ndx.dimension(function (d) {
        var month = d.dd.getMonth();
        if (month <= 2) {
            return 'Q1';
        } else if (month > 2 && month <= 5) {
            return 'Q2';
        } else if (month > 5 && month <= 8) {
            return 'Q3';
        } else {
            return 'Q4';
        }
    });
    var quarterGroup = quarter.group().reduceSum(function (d) {
        return d.in + d.out;
    });


    var month = ndx.dimension(function (d) {
        var month = d.dd.getMonth();
        return (month + 1) + '月';
    });

    var monthGroup = month.group().reduceSum(function (d) {
        return d.in + d.out;
    });



    // Dimension by month
    var moveMonths = ndx.dimension(function (d) {
        return d.month;
    });

    var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
        return Math.abs(d.in - d.out);
    });

    var indexAvgByMonthGroup = moveMonths.group().reduceSum(function (d) {
        return d.out;
    });

    // Group by total movement within month
    var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
        return d.in;
    });


    //yearChart.width(500) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
    //    .height(180)
    //    .margins({top: 20, right: 50, bottom: 20, left: 80})
    //    .dimension(year)
    //    .group(yearGroup)
    //    .centerBar(true)
    //    .gap(1)
    //    .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2015, 11, 31)]))
    //    .round(d3.time.year.round)
    //    .alwaysUseRounding(true)
    //    .xUnits(d3.time.years);

    yearChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
        .width(500)
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

    quarterChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
        .width(280)
        .height(280)
        .radius(80)
        .innerRadius(30)
        .dimension(quarter)
        .group(quarterGroup);

    monthChart /* dc.pieChart('#month-chart', 'chartGroup') */
        .width(280)
        .height(280)
        .radius(80)
        .innerRadius(30)
        .dimension(month)
        .group(monthGroup);

    //#### Stacked Area Chart

    //Specify an area chart by using a line chart with `.renderArea(true)`.
    // <br>API: [Stack Mixin](https://github.com/dc-js/dc.js/blob/master/web/docs/api-latest.md#stack-mixin),
    // [Line Chart](https://github.com/dc-js/dc.js/blob/master/web/docs/api-latest.md#line-chart)
    moveChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(true)
        .width(990)
        .height(200)
        .transitionDuration(1000)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .dimension(moveMonths)
        .mouseZoomable(true)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
        .rangeChart(volumeChart)
        .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2015, 11, 31)]))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        //##### Legend

        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(indexAvgByMonthGroup, 'Monthly Index Average')
        .valueAccessor(function (d) {
            return d.value;
        })
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
        .stack(monthlyMoveGroup, 'Monthly Index Move', function (d) {
            return d.value;
        })
        // Title can be called by any stack layer.
        .title(function (d) {
            return d.value;
        });

    inoutChar
        .width(990)
        .height(200)
        .rangeChart(volumeChart)
        .yAxisLabel("人次")
        .margins({top: 30, right: 50, bottom: 25, left: 80})
        .legend(dc.legend().x(100).y(20).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2015, 11, 31)]))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .brushOn(false)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .compose([inChart, outChart])

    inChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(true)
        .transitionDuration(1000)
        .dimension(moveMonths)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".

        //##### Legend
        .colors('red')
        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(indexAvgByMonthGroup, '捷運站進站人次')
        .valueAccessor(function (d) {
            return d.value;
        })
        // Title can be called by any stack layer.
        .title(function (d) {
            return d.value;
        });

    outChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(true)
        .transitionDuration(1000)
        .dimension(moveMonths)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
        //##### Legend
        .colors('blue')
        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(monthlyMoveGroup, '捷運站出站人次')
        .valueAccessor(function (d) {
            return d.value;
        })
        // Title can be called by any stack layer.
        .title(function (d) {
            return d.value;
        });



    //#### Range Chart

    // Since this bar chart is specified as "range chart" for the area chart, its brush extent
    // will always match the zoom of the area chart.
    volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(40)
        .margins({top: 0, right: 50, bottom: 20, left: 80})
        .dimension(moveMonths)
        .group(volumeByMonthGroup)
        .centerBar(true)
        .gap(1)
        .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2015, 11, 31)]))
        .round(d3.time.month.round)
        .alwaysUseRounding(true)
        .xUnits(d3.time.months);

    dc.renderAll();
});