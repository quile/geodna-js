
function value_is_near ( value, comparator, error ) {
    error = error || 0.005;
    return ( Math.abs(comparator - value) < error );
}

var geo = GeoDNA.encode( -41.288889, 174.777222, { precision: 22 } );
if (geo != 'etctttagatagtgacagtcta') {
    throw"Wellington's DNA is correct";
}

var bits = GeoDNA.decode( geo );

if ( !value_is_near( bits[0], -41.288889 )) {
    throw "Latitude converted back correctly.";
}

if ( !value_is_near( bits[1], 174.777222 )) {
    throw "Longitude converted back correctly.";
}

geo = GeoDNA.encode( -41.283333, 173.283333, { precision: 16 } );
if ( geo != 'etcttgctagcttagt' ) {
    throw "Nelson's DNA is correct";
}

bits = GeoDNA.decode( geo );
if ( !value_is_near( bits[0], -41.283333, 0.5 ) ) {
    throw "Latitude converted back correctly.";
}
if ( !value_is_near( bits[1], 173.283333, 0.5 ) ) {
    throw "Longitude converted back correctly.";
}

geo = GeoDNA.encode( 7.0625, -95.677068 );
if ( geo != 'watttatcttttgctacgaagt' ) {
    throw "Encoded successfully";
}

var bits = GeoDNA.add_vector( -41.288889, 174.777222, 10.0, 10.0 );
if ( !value_is_near( bits[0], -31.288889 ) ) {
    throw "New latitude is good";
}

if ( !value_is_near( bits[1], -175.222777 ) ) {
    throw "New longitude is good";
}
var neighbours = GeoDNA.neighbours( 'etctttagatag' );
if ( !neighbours || neighbours.length != 8 ) {
    throw "Got back correct neighbours";
}
