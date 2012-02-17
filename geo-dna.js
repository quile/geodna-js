// ---------------------------------------------------

var VERSION = "0.1";
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

        var bits = GeoDNA.bounding_box( geodna );
        var lati = bits[0];
        var loni = bits[1];

        var lat = ( lati[0] + lati[1] ) / 2.0;
        var lon = ( loni[0] + loni[0] ) / 2.0;

        if ( options['radians'] ) {
            return ( _deg2rad( lat ), _deg2rad( lon ) );
        }
        return [ lat, lon ];
    },


    // locates the min/max lat/lons around the geo_dna
    bounding_box: function ( geodna ) {
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
                loni = [ loni[0],  ( loni[0] + loni[1] ) / 2 ];
            }
            if ( cd & 1 ) {
                lati = [ ( lati[0] + lati[1] ) / 2.0, lati[1] ];
            } else {
                lati = [ lati[0],  ( lati[0] + lati[1] ) / 2.0 ];
            }
        }
        return [ lati, loni ];
    },


    add_vector: function ( lat, lon, dy, dx ) {
        return [
            ( ( lat + 90.0 + dy ) % 180.0 ) - 90.0,
            ( ( lon + 180.0 + dx ) % 360.0 ) - 180.0
        ];
    },

    neighbours: function ( geodna ) {
        // TODO:kd - this can be optimised

        var bits = GeoDNA.decode( geodna );
        var lat = bits[0];
        var lon = bits[1];

        bits = GeoDNA.bounding_box( geodna );
        var lati = bits[0];
        var loni = bits[1];

        var width  = Math.abs( loni[1] - loni[0] );
        var height = Math.abs( lati[1] - lati[0] );
        var neighbours = [];

        for (var i = -1; i <= 1; i++ ) {
            for ( var j = -1; j <= 1; j++ ) {
                if ( i || j ) {
                    var bits = GeoDNA.add_vector ( lat, lon, height * i, width * j );
                    neighbours[neighbours.length] = GeoDNA.encode( bits[0], bits[1] );
                }
            }
        }
        return neighbours;
    }
};