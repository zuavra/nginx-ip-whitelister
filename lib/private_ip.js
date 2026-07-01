import { Netmask } from 'netmask';
const PRIVATE_RANGES = [
    // FIXME: keep IPv6 ranges first until Netmask solves issue #62
    //        .contains() throws if called with an IPv4-mapped IPv6 address on an IPv4 range
    '::/128',
    '::1/128',
    '::ffff:0:0/96',
    '64:ff9b::/96',
    '64:ff9b:1::/48',
    '100::/64',
    '2001::/32',
    '2001:20::/28',
    '2001:db8::/32',
    '2002::/16',
    '3fff::/20',
    '5f00::/16',
    'fc00::/7',
    'fe80::/10',
    'ff00::/8',

    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '192.88.99.0/24',
    '192.168.0.0/16',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '233.252.0.0/24',
    '240.0.0.0/4',
    '255.255.255.255/32',
].map(mask => new Netmask(mask));

export default ip => {
    for (let i = 0; i < PRIVATE_RANGES.length; i++) {
        if (PRIVATE_RANGES[i].contains(ip)) return true;
    }
    return false;
}
