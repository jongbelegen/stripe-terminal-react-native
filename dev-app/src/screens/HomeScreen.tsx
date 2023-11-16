import React, { useEffect, useState, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-root-toast';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  Switch,
} from 'react-native';
import { colors } from '../colors';
import { AppContext } from '../AppContext';
import icon from '../assets/icon.png';
import ListItem from '../components/ListItem';
import List from '../components/List';
import {
  getDiscoveryMethod,
  setDiscoveryMethod as setStoredDiscoveryMethod,
} from '../util/merchantStorage';
import {
  OfflineStatus,
  Reader,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { account } = useContext(AppContext);
  const [simulated, setSimulated] = useState<boolean>(true);
  const [online, setOnline] = useState<boolean>(true);
  const [discoveryMethod, setDiscoveryMethod] =
    useState<Reader.DiscoveryMethod>('bluetoothScan');
  const { disconnectReader, connectedReader } = useStripeTerminal({
    onDidChangeOfflineStatus(status: OfflineStatus) {
      console.log('offline status = ' + status.networkStatus);
      setOnline(status.networkStatus == 'online' ? true : false);
    },
    onDidForwardingFailure(error) {
      console.log('onDidForwardingFailure ' + error?.message);
      let toast = Toast.show(error?.message ? error.message : 'unknown error', {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
      });

      setTimeout(function () {
        Toast.hide(toast);
      }, 3000);
    },
    onDidForwardPaymentIntent(paymentIntent) {
      console.log('onDidForwardPaymentIntent = ' + paymentIntent.id);
      let toast = Toast.show(
        'Payment Intent ' + paymentIntent.id + ' forwarded',
        {
          duration: Toast.durations.LONG,
          position: Toast.positions.BOTTOM,
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        }
      );

      setTimeout(function () {
        Toast.hide(toast);
      }, 3000);
    },
  });
  const batteryPercentage =
    (connectedReader?.batteryLevel ? connectedReader?.batteryLevel : 0) * 100;
  const batteryStatus = batteryPercentage
    ? '🔋' + batteryPercentage.toFixed(0) + '%'
    : '';
  const chargingStatus = connectedReader?.isCharging ? '🔌' : '';

  useEffect(() => {
    const loadDiscSettings = async () => {
      const savedDisc = await getDiscoveryMethod();

      if (!savedDisc) {
        return;
      }

      setDiscoveryMethod(savedDisc.method);
      setSimulated(savedDisc.isSimulated);
    };

    loadDiscSettings();
  }, []);

  const renderConnectedContent = (
    <>
      <List title="READER CONNECTION">
        <ListItem
          title="Disconnect"
          testID="disconnect-button"
          color={colors.red}
          onPress={async () => {
            await disconnectReader();
          }}
        />
      </List>

      <List title="COMMON WORKFLOWS">
        <ListItem
          title="Collect card payment"
          onPress={() => {
            navigation.navigate('CollectCardPaymentScreen', {
              simulated,
              discoveryMethod,
            });
          }}
        />
        <ListItem
          title="Set reader display"
          onPress={() => {
            navigation.navigate('ReaderDisplayScreen');
          }}
        />
        <ListItem
          title="Store card via Setup Intents"
          onPress={() => {
            navigation.navigate('SetupIntentScreen', { discoveryMethod });
          }}
        />
        <ListItem
          title="In-Person Refund"
          onPress={() => {
            navigation.navigate('RefundPaymentScreen', {
              simulated,
              discoveryMethod,
            });
          }}
        />
      </List>
      <List title="DATABASE">
        <ListItem
          title="Database"
          onPress={async () => {
            navigation.navigate('DatabaseScreen');
          }}
        />
      </List>
    </>
  );

  return (
    <ScrollView testID="home-screen" style={styles.container}>
      <View style={styles.accountContainer}>
        <Text style={styles.readerName}>
          {account?.settings?.dashboard?.display_name} ({account?.id})
        </Text>
        {account && (
          <View
            style={[
              styles.indicator,
              { backgroundColor: online ? colors.green : colors.red },
            ]}
          />
        )}
      </View>
      {connectedReader ? (
        <View style={styles.connectedReaderContainer}>
          <View style={styles.imageContainer}>
            <Image source={icon} style={styles.image} />
          </View>

          <Text style={styles.readerName}>{connectedReader.deviceType}</Text>
          <Text style={styles.connectionStatus}>
            Connected{simulated && <Text>, simulated</Text>}
          </Text>
          <Text style={styles.connectionStatus}>
            {batteryStatus} {chargingStatus}
          </Text>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <Image source={icon} style={styles.image} />
        </View>
      )}

      {connectedReader ? (
        renderConnectedContent
      ) : (
        <>
          <List topSpacing={false} title="MERCHANT SELECTION">
            <ListItem
              title="Set Merchant"
              color={colors.blue}
              onPress={() => {
                navigation.navigate('MerchantSelectScreen');
              }}
            />
            <ListItem
              title="Discover Readers"
              color={colors.blue}
              disabled={!account}
              onPress={() => {
                navigation.navigate('DiscoverReadersScreen', {
                  simulated,
                  discoveryMethod,
                });
              }}
            />

            <ListItem
              title="Register Internet Reader"
              disabled={!account}
              color={colors.blue}
              onPress={() => {
                navigation.navigate('RegisterInternetReader');
              }}
            />
          </List>

          <List topSpacing={false} title="DATABASE">
            <ListItem
              title="Database"
              testID="database"
              color={colors.blue}
              onPress={async () => {
                navigation.navigate('DatabaseScreen');
              }}
            />
          </List>

          <List topSpacing={false} title="DISCOVERY METHOD">
            <ListItem
              title={mapFromDiscoveryMethod(discoveryMethod)}
              testID="discovery-method-button"
              onPress={() =>
                navigation.navigate('DiscoveryMethodScreen', {
                  onChange: async (value: Reader.DiscoveryMethod) => {
                    await setStoredDiscoveryMethod({
                      method: value,
                      isSimulated: simulated,
                    });
                    setDiscoveryMethod(value);
                  },
                })
              }
            />
          </List>

          <List>
            <ListItem
              title="Simulated"
              rightElement={
                <Switch
                  value={simulated}
                  onValueChange={async (value) => {
                    await setStoredDiscoveryMethod({
                      method: discoveryMethod,
                      isSimulated: value,
                    });
                    setSimulated(value);
                  }}
                />
              }
            />

            <Text style={styles.infoText}>
              The SDK comes with the ability to simulate behavior without using
              physical hardware. This makes it easy to quickly test your
              integration end-to-end, from connecting a reader to taking
              payments.
            </Text>
          </List>
        </>
      )}
    </ScrollView>
  );
}

function mapFromDiscoveryMethod(method: Reader.DiscoveryMethod) {
  switch (method) {
    case 'bluetoothScan':
      return 'Bluetooth Scan';
    case 'bluetoothProximity':
      return 'Bluetooth Proximity';
    case 'internet':
      return 'Internet';
    case 'handoff':
      return 'Handoff';
    case 'localMobile':
      return 'Local mobile';
    case 'usb':
      return 'USB';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
  },
  groupTitle: {
    color: colors.dark_gray,
    fontWeight: '600',
    paddingLeft: 16,
    marginVertical: 12,
  },
  group: {
    marginTop: 22,
    marginBottom: 20,
  },
  image: {
    width: 40,
    height: 24,
  },
  imageContainer: {
    borderRadius: 6,
    width: 60,
    height: 50,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    marginVertical: 10,
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
  connectedReaderContainer: {
    alignItems: 'center',
  },
  accountContainer: {
    marginTop: 10,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  readerName: {
    width: '60%',
    textAlign: 'center',
    fontWeight: '600',
    color: colors.dark_gray,
  },
  connectionStatus: {
    color: colors.dark_gray,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: colors.red,
  },
});
