function initMap() {

    const SOURCE_URL = 'https://spidersweb-map.github.io/koaza-map/src/'
    
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
    document.getElementById("mapmesh").checked = (queries.mapmesh == 1);
    
    // PMTiles対応
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
//    const pmtiles = new pmtiles.PMTiles('map_data.pmtiles');

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
            
            // フォント読み込み
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
    const mapPaintWidth2 = ['interpolate', ['exponential', 2], ['zoom'], 10, 1.5, 20, 75];
    const mapDashArray = [3, 2];
    // mapの見た目：ラベル関連
    const getMapLabelLayout = (fontWeight, sizeType) => {
        let textSize;
        if (sizeType == 'small') {
            textSize = ['interpolate', ['exponential', 2], ['zoom'], 
                12.5, ['*', ['to-number', ['get', 'label_size'], 8], 0.1], 
                17, ['*', ['to-number', ['get', 'label_size'], 9], 1.9]
            ]
        } else {
            textSize = ['interpolate', ['exponential', 2], ['zoom'], 
                11.5, ['*', ['to-number', ['get', 'label_size'], 8], 0.15], 
                17, ['*', ['to-number', ['get', 'label_size'], 9], 1.9]
            ]
        };
        
        
        const mapLabelLayout = {
            'text-field': ['case', ['all', ['has', 'label'], ['!=',['get', 'label'],'']], ['get', 'label'], ['get', 'name']],
            'text-font': ['literal',['Noto Sans CJK JP ' + fontWeight]],
            'text-size': textSize, 
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
    const mapLabelHaloWidth = 2.5;
    const mapLabelHaloBlur = 1;
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

        // PMTiles読み込み
        map.addSource('map_lines', {
            type: 'vector',
            tiles: ['pmtiles://' + SOURCE_URL + '/pmtiles/map_lines.pmtiles/{z}/{x}/{y}.pbf'],
        });
        map.addSource('map_labels', {
            type: 'vector',
            tiles: ['pmtiles://' + SOURCE_URL + '/pmtiles/map_labels.pmtiles/{z}/{x}/{y}.pbf'],
        });
        map.addSource('map_mesh', {
            type: 'vector',
            tiles: ['pmtiles://' + SOURCE_URL + '/pmtiles/map_mesh.pmtiles/{z}/{x}/{y}.pbf'],
        });

        map.addLayer({
            id: 'small_dist_dashed',
            type: 'line',
            source: 'map_lines',
            'source-layer': 'small_dist_dashed',
            layout: mapLayout,
            paint: {'line-color': mapColorBlue, 'line-width': mapPaintWidth1, 'line-dasharray': mapDashArray, 'line-opacity': queries.opacityTop}
        });
        map.addLayer({
            id: 'small_dist',
            type: 'line',
            source: 'map_lines',
            'source-layer': 'small_dist',
            layout: mapLayout,
            paint: {'line-color': mapColorBlue, 'line-width': mapPaintWidth1, 'line-opacity': queries.opacityTop}
        });
        map.addLayer({
            id: 'big_dist_dashed',
            type: 'line',
            source: 'map_lines',
            'source-layer': 'big_dist_dashed',
            layout: mapLayout,
            // paint: {'line-color': mapColorRed, 'line-width': mapPaintWidth2, 'line-dasharray': mapDashArray, 'line-opacity': queries.opacityTop}
            paint: {
                'line-color': mapColorRed, 
                'line-width': mapPaintWidth2, 
                'line-dasharray': mapDashArray, 
                'line-opacity': ['case', ['==', ['get', 'line_style'], 'trnsdashed'], queries.opacityTop * 0.6, queries.opacityTop]
            }
        });
        map.addLayer({
            id: 'big_dist',
            type: 'line',
            source: 'map_lines',
            'source-layer': 'big_dist',
            layout: mapLayout,
            // paint: {'line-color': mapColorRed, 'line-width': mapPaintWidth2, 'line-opacity': queries.opacityTop}
            paint: {
                'line-color': mapColorRed, 
                'line-width': mapPaintWidth2, 
                'line-opacity': ['case', ['==', ['get', 'line_style'], 'trnsnormal'], queries.opacityTop * 0.6, queries.opacityTop]
            }
        });
        map.addLayer({
            id: 'small_name',
            type: 'symbol',
            source: 'map_labels',
            'source-layer': 'small_name',
            layout: getMapLabelLayout('Regular', 'small'),
            paint: {
                'text-color': mapColorBlue, 
                'text-opacity': queries.opacityTop * 0.9, 
                'text-halo-width': mapLabelHaloWidth,
                'text-halo-blur': mapLabelHaloBlur,
                'text-halo-color': mapLabelHaloColor
            },
            minzoom: 13,
        });
        map.addLayer({
            id: 'big_name',
            type: 'symbol',
            source: 'map_labels',
            'source-layer': 'big_name',
            layout: getMapLabelLayout('Bold', 'big'),
            paint: {
                'text-color': mapColorRed, 
                // 'text-opacity': queries.opacityTop * 0.7,
                'text-opacity': ['case', ['==', ['get', 'region'], '(旧村)'], queries.opacityTop * 0.45, queries.opacityTop * 0.7],
                'text-halo-width': mapLabelHaloWidth,
                'text-halo-blur': mapLabelHaloBlur,
                'text-halo-color': mapLabelHaloColor
            },
            minzoom: 11,
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
        addMapMesh(queries.mapmesh);
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
        if (e.features[0].properties.region.includes('・')) {
            let reg_name = e.features[0].properties.region.split('(')[1]
            let tmp_txts = e.features[0].properties.region.split('・').map((oaza) => 
                '<p class="oaza"><a href="' 
                + getLinkText(oaza + '(' + reg_name)
                + '" target="_blank" rel="noopener noreferrer">'
                + getRegionName(oaza + '(' + reg_name)
                + '</a></p>'
            );
            new maplibregl.Popup({closeButton: false})
                .setLngLat(e.lngLat)
                .setHTML(
                    '<div class="popup"><p class="koaza">' 
                    + e.features[0].properties.name 
                    + '</p>'
                    + tmp_txts.join('')
                    + '</div>'
                ).addTo(map);
        } else {
            new maplibregl.Popup({closeButton: false})
                .setLngLat(e.lngLat)
                .setHTML(
                    '<div class="popup"><p class="koaza">' 
                    + e.features[0].properties.name 
                    + '</p><p class="oaza"><a href="'
                    + getLinkText(e.features[0].properties.region)
                    + '" target="_blank" rel="noopener noreferrer">' 
                    + getRegionName(e.features[0].properties.region)
                    + '</a></p></div>'
                ).addTo(map);
        };
    });
    
    // ポップアップ表示(大字名)
    map.on('click', 'big_name', (e) => {
        if (e.features[0].properties.name.includes('・')) {
            let tmp_txts = e.features[0].properties.name.split('・').map((oaza) => 
                '<p><a href="' 
                + getLinkTextOaza(oaza, e.features[0].properties.region)
                + '" target="_blank" rel="noopener noreferrer">'
                + getRegionNameOaza(oaza, e.features[0].properties.region)
                + '</a></p>'    
            );
            new maplibregl.Popup({closeButton: false})
                .setLngLat(e.lngLat)
                .setHTML(
                    '<div class="popup-oaza">'
                    + tmp_txts.join('')
                    + '<p>入会地</p></div>'
                ).addTo(map);
        } else if (e.features[0].properties.region != '(旧村)') {
            new maplibregl.Popup({closeButton: false})
                .setLngLat(e.lngLat)
                .setHTML(
                    '<div class="popup-oaza"><p><a href="'
                    + getLinkTextOaza(e.features[0].properties.name, e.features[0].properties.region)
                    + '" target="_blank" rel="noopener noreferrer">'
                    + getRegionNameOaza(e.features[0].properties.name, e.features[0].properties.region)
                    + '</a></p></div>'
                ).addTo(map);
        };
    });
};


function getRegionName(region) {
    if (region == "(unknown)") {
        return "(所属不明)"
    } else {
        const lastChar = ["村","町","宿","区","組","駅"];
        const excludeName = ["松田惣領", "松田庶子", "小原"];
        const excludeRegion = ["区部", "島嶼部"];
        var gun = region.split("(")[1].replace(")","");
        var mura = region.split("(")[0];
        if (excludeRegion.includes(gun)) {
            gun = "";
        } else {
            gun += "郡";
        };
        if (
            !lastChar.includes(mura.slice(-1)) 
            && !excludeName.includes(mura)
            && !(mura.includes("新田") && mura.length != 2) 
            && !mura.endsWith("丁目")
        ) {
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
    const excludeRegion = ["区部", "島嶼部"];
    var gun = region;
    if (!excludeRegion.includes(gun)) {gun += "郡"};
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
            base: url.searchParams.get('base'),
            mapmesh: Number(url.searchParams.get('mapmesh'))
        }
        return resultObj
    } else {
        const defaultObj = {
            lng: 139.43750000000014,
            lat: 35.541677489996715,
            zoom: 12,
            opacityBase: 0.5,
            opacityTop: 1.0,
            base: 'gsi_pale',
            mapmesh: 0
        };
        Object.entries(defaultObj).forEach(([key,val],idx) => {
            url.searchParams.set(key, val); 
        });
        
        //console.log(defaultObj.base);
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
    map.setPaintProperty('big_dist_dashed', 'line-opacity', ['case', ['==', ['get', 'line_style'], 'trnsdashed'], opacity * 0.6, opacity]);
    map.setPaintProperty('big_dist', 'line-opacity', ['case', ['==', ['get', 'line_style'], 'trnsnormal'], opacity * 0.6, opacity]);
    map.setPaintProperty('small_name', 'text-opacity', opacity * 0.9);
    map.setPaintProperty('big_name', 'text-opacity', ['case', ['==', ['get', 'region'], '(旧村)'], opacity * 0.42, opacity * 0.7]);
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


function handleMapmeshSelect(element) {
    const isVisible = element.checked;
    map.setLayoutProperty('map_mesh', 'visibility', isVisible? 'visible' : 'none');
    map.setLayoutProperty('map_label', 'visibility', isVisible? 'visible' : 'none');
    url.searchParams.set('mapmesh', isVisible? 1 : 0);
    history.replaceState(null, pageName, url);
};


function addMapMesh(isVisibleNum) {
    const meshColor = '#FF0000'
    map.addLayer({
        id: 'map_mesh',
        type: 'line',
        source: 'map_mesh',
        'source-layer': 'map_mesh',
        paint: {'line-color': meshColor, 'line-width': 1.0, 'line-opacity': 1.0},
        filter: ['==', 'category', 'map_mesh'],
        minzoom: 8
    });
    map.addLayer({
        id: 'map_label',
        type: 'symbol',
        source: 'map_mesh',
        'source-layer': 'map_mesh',
        layout: {
            'text-field': ['get', 'label'],
            'text-font': ['literal',['Noto Sans CJK JP Regular']],
            'text-size': ['interpolate', ['exponential', 2], ['zoom'], 
                8, 8.0, 
                14, 150.0
            ],
            'text-allow-overlap': true,
            'text-letter-spacing': 0,
            'text-line-height': 1.0,
        },
        paint: {
            'text-color': meshColor, 
            'text-opacity': 1.0,
            'text-halo-width': 3.0,
            'text-halo-blur': 1.5,
            'text-halo-color': '#FFFFFF'
        },
        filter: ['==', 'category', 'map_label'],
        minzoom: 8
    });
    
    map.setLayoutProperty('map_mesh', 'visibility', (isVisibleNum == 1)? 'visible' : 'none');
    map.setLayoutProperty('map_label', 'visibility', (isVisibleNum == 1)? 'visible' : 'none');
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
