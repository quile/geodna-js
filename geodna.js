// ---------------------------------------------------
// geodna.js - (C) KD 2012
// ---------------------------------------------------
// Converts between lat/lon and a "geodna" code,
// which is a single string representing a point
// on the earth's surface.   The string is basically
// an approximation to the lat/lon coordinate,
// and the longer the string, the more accurate it
// will be.   In general, coordinates that are
// close together will share a string prefix,
// making these codes very useful for providing
// very fast proximity searching using only
// text-based approaches (eg. SQL's "LIKE" operator)
// ---------------------------------------------------

var VERSION = "0.2";
var RADIUS_OF_EARTH = 6378100;
var ALPHABET = [ "g", "a", "t", "c", ];
var DECODE_MAP = {
    g: 0,
    a: 1,
    t: 2,
    c: 3,
};

function _deg2rad ( degrees ) {
    return degrees * ( Math.PI / 180 );
}

function _rad2deg ( radians ) {
    return radians * ( 180 / Math.PI );
}

function _mod ( x, m) {
    return ( x % m + m ) % m;
}

GeoDNA = {
    encode: function( latitude, longitude, options ) {
        options   = options || {};
        var precision = options['precision'] || 22;

        var geodna = '';
        var loni = [];
        var lati = [];

        if ( options['radians'] ) {
            latitude  = _rad2deg( latitude );
            longitude = _rad2deg( longitude );
        }

        var bits = GeoDNA.normalise( latitude, longitude );
        latitude = bits[0];
        longitude = bits[1];

        if ( longitude < 0 ) {
            geodna = geodna + 'w';
            loni = [ -180.0, 0.0 ];
        } else {
            geodna = geodna + 'e';
            loni = [ 0.0, 180.0 ];
        }

        lati = [ -90.0, 90.0 ];

        while ( geodna.length < precision ) {
            var ch = 0;

            var mid = ( loni[0] + loni[1] ) / 2.0;
            if ( longitude > mid ) {
                ch = ch | 2;
                loni = [ mid, loni[1] ];
            } else {
                loni = [ loni[0], mid ];
            }

            mid = ( lati[0] + lati[1] ) / 2.0;
            if ( latitude > mid ) {
                ch = ch | 1;
                lati = [ mid, lati[1] ];
            } else {
                lati = [ lati[0], mid ];
            }

            geodna = geodna + ALPHABET[ch];
        }
        return geodna;
    },

    decode: function ( geodna, options ) {
        options = options || {};

        var bits = GeoDNA.boundingBox( geodna );
        var lati = bits[0];
        var loni = bits[1];

        var lat = ( lati[0] + lati[1] ) / 2.0;
        var lon = ( loni[0] + loni[1] ) / 2.0;

        if ( options['radians'] ) {
            return ( _deg2rad( lat ), _deg2rad( lon ) );
        }
        return [ lat, lon ];
    },


    // locates the min/max lat/lons around the geo_dna
    boundingBox: function ( geodna, size ) {
        var chars = geodna.split(new RegExp(''));

        var loni;
        var lati = [ -90.0, 90.0 ];

        var first = chars[0];

        if ( first == 'w' ) {
            loni = [ -180.0, 0.0 ];
        } else if ( first == 'e' ) {
            loni = [ 0.0, 180.0 ];
        }

        for ( var i = 1; i < chars.length; i++ ) {
            var c  = chars[i];
            var cd = DECODE_MAP[c];
            if ( cd & 2 ) {
                loni = [ ( loni[0] + loni[1] ) / 2.0, loni[1] ];
            } else {
                loni = [ loni[0],  ( loni[0] + loni[1] ) / 2.0 ];
            }
            if ( cd & 1 ) {
                lati = [ ( lati[0] + lati[1] ) / 2.0, lati[1] ];
            } else {
                lati = [ lati[0],  ( lati[0] + lati[1] ) / 2.0 ];
            }
        }
        return [ lati, loni ];
    },

    addVector: function ( lat, lon, dy, dx ) {
        return [
            _mod(( lat + 90.0 + dy ), 180.0 ) - 90.0,
            _mod(( lon + 180.0 + dx ), 360.0 ) - 180.0
        ];
    },

    normalise: function( lat, lon ) {
        return [
            _mod(( lat + 90.0 ), 180.0 ) - 90.0,
            _mod(( lon + 180.0 ), 360.0 ) - 180.0,
        ];
    },

    neighbours: function ( geodna ) {
        var bits = GeoDNA.decode( geodna );
        var lat = bits[0];
        var lon = bits[1];

        bits = GeoDNA.boundingBox( geodna );
        var lati = bits[0];
        var loni = bits[1];

        var width  = Math.abs( loni[1] - loni[0] );
        var height = Math.abs( lati[1] - lati[0] );
        var neighbours = [];

        for (var i = -1; i <= 1; i++ ) {
            for ( var j = -1; j <= 1; j++ ) {
                if ( i || j ) {
                    var bits = GeoDNA.addVector ( lat, lon, height * i, width * j );
                    neighbours[neighbours.length] = GeoDNA.encode( bits[0], bits[1], { precision: geodna.length } );
                }
            }
        }
        return neighbours;
    },

    // Google Maps support functions

    encodeGoogleLatLng: function( latlng, options ) {
        var lat = latlng.lat();
        var lon = latlng.lng();
        return GeoDNA.encode( lat, lon, options );
    },

    decodeGoogleLatLng: function( geodna ) {
        var bits = GeoDNA.decode( geodna );
        return new google.maps.LatLng( bits[0], bits[1] );
    },

    boundingBoxPolygon: function( geodna, options ) {
        var bbox = GeoDNA.boundingBox( geodna );
        var vertices = [
            new google.maps.LatLng( bbox[0][0], bbox[1][0] ),
            new google.maps.LatLng( bbox[0][0], bbox[1][1] ),
            new google.maps.LatLng( bbox[0][1], bbox[1][1] ),
            new google.maps.LatLng( bbox[0][1], bbox[1][0] )
        ];

        options['paths'] = vertices;
        return new google.maps.Polygon( options );
    },

    map: function( geodna, element, options ) {
        options = options || {};
        var mapOptions = {
            center: GeoDNA.decodeGoogleLatLng( geodna ),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        for (var key in options) {
            mapOptions[key] = options[key];
        }

        var map = new google.maps.Map(element, mapOptions);

        console.log(map);
        return map;
    }
};
