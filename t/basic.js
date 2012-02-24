function ok( condition, message ) {
    if (!condition) {
        throw "Test failure: " + message;
    }
}

function value_is_near ( value, comparator, error ) {
    error = error || 0.005;
    return ( Math.abs(comparator - value) < error );
}

var wellington = GeoDNA.encode( -41.288889, 174.777222, { precision: 22 } );
ok ( wellington == 'etctttagatagtgacagtcta', "Wellington's DNA is correct" );

var bits = GeoDNA.decode( wellington );
ok ( value_is_near( bits[0], -41.288889 ), "Latitude converted back correctly." );
ok ( value_is_near( bits[1], 174.777222 ), "Longitude converted back correctly." );

var nelson = GeoDNA.encode( -41.283333, 173.283333, { precision: 16 } );
ok ( nelson == 'etcttgctagcttagt', "Nelson's DNA is correct" );

bits = GeoDNA.decode( nelson );
ok ( value_is_near( bits[0], -41.283333, 0.5 ), "Latitude converted back correctly." );
ok ( value_is_near( bits[1], 173.283333, 0.5 ), "Longitude converted back correctly." );

geo = GeoDNA.encode( 7.0625, -95.677068 );
ok ( geo == 'watttatcttttgctacgaagt', "Encoded successfully" );

var bits = GeoDNA.addVector( wellington, 10.0, 10.0 );
ok ( value_is_near( bits[0], -31.288889 ), "New latitude is good" );
ok ( value_is_near( bits[1], -175.222777 ), "New longitude is good" );

var neighbours = GeoDNA.neighbours( 'etctttagatag' );
ok ( neighbours && neighbours.length == 8, "Got back correct neighbours" );
