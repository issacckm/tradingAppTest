function checkIsDataUpdated(oldData, newData) {
  for(let i = 0; i < newData.length; i++) {
    if (newData[i] !== oldData[i]) {
      return true;
    }
  }
  return false;
}

var DataAdaptor = {
  data: null,
  updateDataIDs: [],
  updateDataListeners: [],
  previousData: [-1,-1,-1,-1,-1,-1],
  onDataReceived: function(data, callback) {
    var bars = [];
    var k = data.k || [];
    var firstBarData, lastBarData;
    this.data = data;
    if (k.length === 0) {
      callback(false);
      return;
    }
    lastBarData = k[k.length-1];
    var isChanged = checkIsDataUpdated(this.previousData, lastBarData);
    if (!isChanged) {
      callback(isChanged);
      return;
    }
    this.previousData = lastBarData;
    for(let i = 0; i < this.updateDataListeners.length; i++) {
      this.updateDataListeners[i]();
    }
    callback(true);
    return;
  },
 
  onReady: function(callback) {
    var configuration = {
      supports_marks: false,
      supports_timescale_marks: false
    };
    callback(configuration);
  },
  
  searchSymbols: function() {
  },
  
  resolveSymbol: function(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    var symbolInfo = {
      name: symbolName,
      description: '',
      session: '24x7',
      has_intraday: true,
      has_empty_bar: true,
      intraday_multipliers: [1],
      has_empty_bars: true,
      timezone: "Asia/Hong_Kong"
    };
    onSymbolResolvedCallback(symbolInfo);
  },
  
  getBars: function(symbolInfo, resolution, fromTime, toTime, onHistoryCallback, onErrorCallback, firstDataRequest) {
    var bars = [];
    var k = this.data.k || [];
    for(var i = 0; i < k.length; i++) {
      bars.push({
        time: k[i][0] * 1000, 
        open: k[i][1], 
        high: k[i][2], 
        low: k[i][3], 
        close: k[i][4], 
        volume: k[i][5]
      });
    }
    var meta = {
      noData: bars.length === 0
    };

    onHistoryCallback(bars, meta);
  },
  
  subscribeBars: function(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    //check listener is existed
    var index = this.updateDataIDs.indexOf(subscriberUID);
    if (index >= 0) {
      this.updateDataListeners[index] = onResetCacheNeededCallback;
    } else {
      this.updateDataListeners.push(onResetCacheNeededCallback);
      this.updateDataIDs.push(subscriberUID);
    }
  },
  
  unsubscribeBars: function() {
    
  },
  
  calculateHistoryDepth: function(resolution, resolutionBack, intervalBack) {
    return {
      resolutionBack: resolutionBack,
      inervalBack: intervalBack
    };
  },
  
  getMarks: function() {
    return undefined;
  },
  
  getTimescaleMarks: function() {
    return undefined;
  },
  
  getServerTime: function() {
    return undefined;
  }
};
