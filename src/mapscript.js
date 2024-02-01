function initMap(src) {

    // クエリパラメータから現在地を読み込む
    // 他の関数でも使うものはグローバル変数に格納
    url = new URL(window.location.href);
    pageName = "小字マップ";
    baseMapNames = ['gsi_pale', 'gsi_std', 'gsi_seamless', 'gsi_4550', 'gsi_6169'];

    var queries = getMapData(url);

    // スライダの位置等を調整
    document.getElementById("opacityBase").value = queries.opacityBase * 100;
    document.getElementById("opacityTop").value = queries.opacityTop * 100;
    document.getElementById(queries.base).checked = true;

    // mapはglobal変数
    map = new maplibregl.Map({
        container: 'map',
        // style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
        style: {
            version: 8,
            sources: {
                rtile: {
                    type: 'raster',
                    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（淡色地図）</a>"
                }
            },
            layers: [{
                id: 'gsi_pale',
                type: 'raster',
                source: 'rtile',
                minzoom: 0,
                maxzoom: 18,
                paint: {'raster-opacity': queries.opacityBase}
            }],
            // glyphs: "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf"
            // glyphs: "https://maps.gsi.go.jp/xyz/noto-jp/{fontstack}/{range}.pbf"
            glyphs: "https://glyphs.geolonia.com/{fontstack}/{range}.pbf",
            // localIdeographFontFamily: ['sans-serif']
        },
        center: [queries.lng, queries.lat],
        zoom: queries.zoom,
        maxZoom: 17
    });
    
    // mapの見た目：境界関連
    const mapLayout = {'line-cap': 'round', 'line-join': 'round'};
    // const mapColorRed = '#AB5500';
    const mapColorRed = '#AB1500';
    // const mapColorRed = '#D06900';
    // const mapColorBlue = '#006CAA';
    const mapColorBlue = '#0085CF';
    const mapPaintWidth1 = ['interpolate', ['exponential', 2], ['zoom'], 10, 1, 20, 50];     // zoom=10でwidth=1、zoom=20でwidth=60
    const mapPaintWidth2 = ['interpolate', ['exponential', 2], ['zoom'], 10, 2, 20, 100];
    const mapDashArray = [5, 3];
    // mapの見た目：ラベル関連
    const getMapLabelLayout = (fontWeight) => {
        const mapLabelLayout = {
            'text-field': ['case', ['all', ['has', 'label'], ['!=',['get', 'label'],'']], ['get', 'label'], ['get', 'name']],
            'text-font': ['literal',['Noto Sans CJK JP ' + fontWeight]],
            'text-size': ['interpolate', ['exponential', 2], ['zoom'], 
                13.5, ['*', ['to-number', ['get', 'label_size'], 9], 0.2], 
                17, ['*', ['to-number', ['get', 'label_size'], 10], 2.0]
            ],
            'text-allow-overlap': true,
            'symbol-z-order': 'source',
            'text-letter-spacing': 0,
            'text-rotate': ['get', 'rotation'],
            'text-rotation-alignment': 'map',
            'text-max-width': ['case', ['==', ['get', 'label_direc'], 'v'], 1, 100],    // 縦書き
            'text-line-height': 1.0
        };
        return mapLabelLayout;
    };
    const mapLabelHaloWidth = 3;
    const mapLabelHaloBlur = 1.5;
    const mapLabelHaloColor = 'white';
    
    const loadLayers = async() => {
        // basemap読み込み
        map.addSource('gsi_std', {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（標準地図）</a>"
        });
        map.addSource('gsi_seamless', {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
            tileSize: 256,
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>全国最新写真（シームレス）</a>"
        });
        map.addSource('gsi_4550', {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/ort_USA10/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>空中写真（1945年～1950年）</a>"
        });
        map.addSource('gsi_6169', {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>空中写真（1961年～1969年）</a>"
        });
                
        // geojson読み込み
        map.addSource('small_dist_dashed', {type: 'geojson', data: src + '/small_dist_dashed.geojson'});
        map.addSource('small_dist', {type: 'geojson', data: src + '/small_dist.geojson'});
        map.addSource('big_dist_dashed', {type: 'geojson', data: src + '/big_dist_dashed.geojson'});
        map.addSource('big_dist', {type: 'geojson', data: src + '/big_dist.geojson'});
        map.addSource('small_name', {type: 'geojson', data: src + '/small_name.geojson'});
        map.addSource('big_name', {type: 'geojson', data: src + '/big_name.geojson'});        
        // レイヤー追加
        map.addLayer({
            id: 'small_dist_dashed',
            type: 'line',
            source: 'small_dist_dashed',
            layout: mapLayout,
            paint: {'line-color': mapColorBlue, 'line-width': mapPaintWidth1, 'line-dasharray': mapDashArray, 'line-opacity': queries.opacityTop}
        });
        map.addLayer({
            id: 'small_dist',
            type: 'line',
            source: 'small_dist',
            layout: mapLayout,
            paint: {'line-color': mapColorBlue, 'line-width': mapPaintWidth1, 'line-opacity': queries.opacityTop}
        });
        map.addLayer({
            id: 'big_dist_dashed',
            type: 'line',
            source: 'big_dist_dashed',
            layout: mapLayout,
            paint: {'line-color': mapColorRed, 'line-width': mapPaintWidth2, 'line-dasharray': mapDashArray, 'line-opacity': queries.opacityTop}
        });
        map.addLayer({
            id: 'big_dist',
            type: 'line',
            source: 'big_dist',
            layout: mapLayout,
            paint: {'line-color': mapColorRed, 'line-width': mapPaintWidth2, 'line-opacity': queries.opacityTop}
        });
        map.addLayer({
            id: 'small_name',
            type: 'symbol',
            source: 'small_name',
            layout: getMapLabelLayout('Regular'),
            paint: {
                'text-color': mapColorBlue, 
                'text-opacity': queries.opacityTop * 0.9, 
                'text-halo-width': mapLabelHaloWidth,
                'text-halo-blur': mapLabelHaloBlur,
                'text-halo-color': mapLabelHaloColor
            },
            minzoom: 12.5,
        });
        map.addLayer({
            id: 'big_name',
            type: 'symbol',
            source: 'big_name',
            layout: getMapLabelLayout('Bold'),
            paint: {
                'text-color': mapColorRed, 
                'text-opacity': queries.opacityTop * 0.7, 
                'text-halo-width': mapLabelHaloWidth,
                'text-halo-blur': mapLabelHaloBlur,
                'text-halo-color': mapLabelHaloColor
            },
            minzoom: 11.5,
        });
    };
    
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
    }));
    
    // 読み込み時  
    map.on('load', () => {
        loadLayers();
        handleBasemapSelect(queries.base);
    });
    
    // 地図の移動を検知
    map.on('moveend', () => {
        url.searchParams.set('lng', map.getCenter().lng);
        url.searchParams.set('lat', map.getCenter().lat);
        history.replaceState(null, pageName, url);
    });
    
    // ズームレベルの変更を検知
    map.on('zoomend', function(e) {
        url.searchParams.set('zoom', map.getZoom());
        history.replaceState(null, pageName, url);
    });
    
    // ポップアップ表示(小字名)
    map.on('click', 'small_name', (e) => {
        new maplibregl.Popup({closeButton: false})
            .setLngLat(e.lngLat)
            .setHTML(
                '<div class="popup"><p class="koaza">' 
                + e.features[0].properties.name 
                + '</p><p class="oaza"><a href="'
                + getLinkText(e.features[0].properties.region)
                + '" target="_blank" rel="noopener noreferrer">' 
                + getRegionName(e.features[0].properties.region)
                + '</a></p></div>')
            .addTo(map);
    });
    
    // ポップアップ表示(大字名)
    map.on('click', 'big_name', (e) => {
        new maplibregl.Popup({closeButton: false})
            .setLngLat(e.lngLat)
            .setHTML(
                '<div class="popup-oaza"><p><a href="'
                + getLinkTextOaza(e.features[0].properties.name, e.features[0].properties.region)
                + '" target="_blank" rel="noopener noreferrer">'
                + getRegionNameOaza(e.features[0].properties.name, e.features[0].properties.region)
                + '</a></p></div>')
            .addTo(map);
    });
    
};


function getRegionName(region) {
    if (region == "(unknown)") {
        return "(所属不明)"
    } else {
        const lastChar = ["村","町","宿","区","組"];
        var gun = region.split("(")[1].replace(")","");
        var mura = region.split("(")[0];
        if (gun == "区部") {
            gun = "";
        } else {
            gun += "郡";
        };
        if (!lastChar.includes(mura.slice(-1)) && !mura.includes("新田") && !mura.endsWith("丁目")) {
            mura += "村";
        };
        return gun + mura;
    };
};


function getLinkText(region) {
    if (region == "(unknown)") {
        return ""
    } else {
        var gun = region.split("(")[1].replace(")","");
        var mura = region.split("(")[0]; 
        if (gun == "区部") {
            var gun_mod = gun;
        } else {
            var gun_mod = gun + "郡";
        };
        return "../pages/" + gun_mod + ".html#" + mura + "_" + gun;
    };
};


function getRegionNameOaza(oaza, region) {
    return getRegionName(oaza + "(" + region + ")");
};


function getLinkTextOaza(oaza, region) {
    var gun = region;
    if (gun != "区部") {gun += "郡"};
    return "../pages/" + gun + ".html#" + oaza + "_" + region;
}


function getMapData(url) {
    if (url.searchParams.has('lng')) {
        const resultObj = {
            lng: Number(url.searchParams.get('lng')),
            lat: Number(url.searchParams.get('lat')),
            zoom: Number(url.searchParams.get('zoom')),
            opacityBase: Number(url.searchParams.get('opacityBase')),
            opacityTop: Number(url.searchParams.get('opacityTop')),
            base: url.searchParams.get('base')
        }
        return resultObj
    } else {
        const defaultObj = {
            lng: 139.43750000000014,
            lat: 35.541677489996715,
            zoom: 12,
            opacityBase: 0.5,
            opacityTop: 1.0,
            base: 'gsi_pale'
        };
        Object.entries(defaultObj).forEach(([key,val],idx) => {
            url.searchParams.set(key, val); 
        });
        history.replaceState(null, pageName, url);
        return defaultObj;
    };
};


function handleMenuPopup() {
    const menu = document.getElementById('menuPopup');
    if (getComputedStyle(menu).display == 'none'){
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }  
};



function handleBaseOpacityChange(val) {
    var opacity = val / 100;
    // 不透明度変更
    baseMapNames.map((mapName) => {
        map.setPaintProperty(mapName, 'raster-opacity', opacity);        
    });
    url.searchParams.set('opacityBase', opacity);
    history.replaceState(null, pageName, url);
};


function handleTopOpacityChange(val) {
    var opacity = val / 100;
    // 不透明度変更
    map.setPaintProperty('small_dist_dashed', 'line-opacity', opacity);
    map.setPaintProperty('small_dist', 'line-opacity', opacity);
    map.setPaintProperty('big_dist_dashed', 'line-opacity', opacity);
    map.setPaintProperty('big_dist', 'line-opacity', opacity);
    map.setPaintProperty('small_name', 'text-opacity', opacity * 0.9);
    map.setPaintProperty('big_name', 'text-opacity', opacity * 0.7);
    url.searchParams.set('opacityTop', opacity);
    history.replaceState(null, pageName, url);
};


function handleBasemapSelect(val) {
    baseMapNames.map((mapName) => {
        if (mapName == val) {
            if (!map.getLayer(mapName)) { addBaseMap(mapName) };
            map.setLayoutProperty(mapName, 'visibility', 'visible');
            url.searchParams.set('base', val);
            history.replaceState(null, pageName, url);
        } else {
            if (map.getLayer(mapName)) {
                map.setLayoutProperty(mapName, 'visibility', 'none');
            }
        };
    });
};


function addBaseMap(mapName) {
    map.addLayer({
       id: mapName,
       type: 'raster',
       source: mapName,
       paint: {'raster-opacity': Number(url.searchParams.get('opacityBase'))},
    }, baseMapNames[0]);
};


function handleLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            map.panTo(pos);
        }, () => {
            handleLocationError(true);
        });
    } else {
        handleLocationError(false);
    }
}
