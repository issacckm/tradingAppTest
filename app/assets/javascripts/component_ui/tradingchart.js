var resolutionMap = {
 "1440": "D",
 "4320": "3D",
 "10080": "W"
};

var TradingChartUI = flight.component(function(){

  this.isChartInited = false;
  this.isWidgetReady = false;
  this.emaEntityId = -1;
  this.maEntityId = -1;
  this.initialIndicator = "MA";
  this.interval = "1";

  this.initChart = function(data, interval) {
    var that = this;
    DataAdaptor.data = data;
    this.widget = new window.TradingView.widget(
      {
        width: '100%',
        height: '99%',
        symbol: 'BTC/CNY',
        interval: this.interval,
        container_id: "candlestick_chart",
        datafeed: DataAdaptor,
        library_path: "/charting_library/",
        drawings_access: { type: 'black', tools: [ { name: "Regression Trend" } ] },
        enabled_features: ["hide_last_na_study_output"],
        disabled_features: ["use_localstorage_for_settings","header_widget", "border_around_the_chart", "left_toolbar", "control_bar", "timeframes_toolbar", "edit_buttons_in_legend", "context_menus"],
        overrides: {
	  "paneProperties.background": "#222222",
	  "paneProperties.vertGridProperties.color": "#454545",
	  "paneProperties.horzGridProperties.color": "#454545",
	  "symbolWatermarkProperties.transparency": 90,
	  "scalesProperties.textColor" : "#AAA"
        },
        loading_screen: {backgroundColor: "#000000", foregroundColor: "#000000"}
      }
    );
    this.widget.onChartReady(function(){
	that.isWidgetReady = true; 
	this.chart().createStudy('MACD', false, false, [14, 30, "close", 9]);
        that.emaEntityId = this.chart().createStudy('Moving Average Exponential', false, false, [9], null, {'Plot.color': '#0FFF0F'});
        that.maEntityId = this.chart().createStudy('Moving Average', false, false, [9], null, {'Plot.color': '#FFFF00'});
        var invisibleId = that.initialIndicator === 'EMA' ? that.maEntityId : that.emaEntityId;
        this.chart().setEntityVisibility(invisibleId, false);
        that.unmask();
    });
    this.isChartInited = true;
    return true;
  }

  this.mask = function() {  
	return this.$node.find('.mask').show();
  }

  this.unmask = function() {
    return this.$node.find('.mask').hide();
  }

  this.request = function(event, data) {
    if (!data) {
      return this.unmask();
    }
    if (this.isWidgetReady) {
      var value = data.x || 1;
      var finalValue = "D";
      if (value >= 1440) {
        finalValue = resolutionMap[value.toString()];
      } else {
        finalValue = value.toString();
      }
      this.interval = finalValue;
    }
    return this.unmask();
  };

  this.response = function(event, data) {
    if (!this.isChartInited) {
      this.initChart(data);
    } else {
      var chart = this.widget.chart();
      chart.setResolution(this.interval);
      DataAdaptor.onDataReceived(data, function(isDataChanged) {
	if (isDataChanged) {
          chart.resetData();
        }
      });
    }
    return this.trigger('market::candlestick::created', data);
  };

  this.updateByTrades = function(event, data) {

  }

  this.switchMainIndicator = function(event, data) {
     if (this.isWidgetReady) {
     	var invisibleId = this.emaEntityId;
     	var visibleId = this.maEntityId;
     	if (data.x === "EMA") {
       		invisibleId = this.maEntityId;
       		visibleId = this.emaEntityId;
     	}
     	this.widget.chart().getStudyById(invisibleId).setVisible(false);
     	this.widget.chart().getStudyById(visibleId).setVisible(true);
    } else {
      this.initialIndicator = data.x;
    }
  }
  
  this.switchType = function(event, data) {
    var chartTypeMap = {
       'close': 2,
       'candlestick': 1
    };
    if (this.isWidgetReady) {
      this.widget.chart().setChartType(chartTypeMap[data.x]);
    }
  }

  return this.after('initialize', function() {
    this.on(document, 'market::candlestick::request', this.request);
    this.on(document, 'market::candlestick::response', this.response);
    this.on(document, 'market::candlestick::trades', this.updateByTrades);
    this.on(document, 'switch::main_indicator_switch', this.switchMainIndicator);
    this.on(document, 'switch::type_switch', this.switchType);
  });
});
