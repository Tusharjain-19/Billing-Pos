package com.billingpro.bookmydine;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final String PREF_NAME = "BillingProPrinterPrefs";
    private static final String KEY_PRINTER_ADDR = "saved_printer_address";
    private static final String KEY_PRINTER_NAME = "saved_printer_name";

    private final Map<String, String> discoveredDevices = Collections.synchronizedMap(new LinkedHashMap<>());
    private BluetoothSocket activeSocket = null;
    private OutputStream activeOutputStream = null;
    private String connectedAddress = null;
    private String connectedName = null;
    private boolean receiverRegistered = false;

    private final BroadcastReceiver discoveryReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (device != null) {
                    try {
                        String name = device.getName();
                        String address = device.getAddress();
                        if (address != null) {
                            if (name == null || name.trim().isEmpty()) {
                                name = "Bluetooth Device (" + address.substring(Math.max(0, address.length() - 5)) + ")";
                            }
                            discoveredDevices.put(address, name);
                        }
                    } catch (SecurityException ignored) {}
                }
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestBluetoothPermissions();
        registerBluetoothDiscoveryReceiver();
        setupPrinterBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        registerBluetoothDiscoveryReceiver();
        setupPrinterBridge();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        closeActiveSocket();
        unregisterBluetoothDiscoveryReceiver();
    }

    private void registerBluetoothDiscoveryReceiver() {
        if (!receiverRegistered) {
            try {
                IntentFilter filter = new IntentFilter();
                filter.addAction(BluetoothDevice.ACTION_FOUND);
                filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
                registerReceiver(discoveryReceiver, filter);
                receiverRegistered = true;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void unregisterBluetoothDiscoveryReceiver() {
        if (receiverRegistered) {
            try {
                unregisterReceiver(discoveryReceiver);
                receiverRegistered = false;
            } catch (Exception ignored) {}
        }
    }

    private void setupPrinterBridge() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.addJavascriptInterface(new AndroidPrinterBridge(), "AndroidPrinterBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void requestBluetoothPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ (API 31+)
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.BLUETOOTH_CONNECT);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.BLUETOOTH_SCAN);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            }
        } else {
            // Android 6 to 11
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
            }
        }

        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsNeeded.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    private synchronized void closeActiveSocket() {
        if (activeOutputStream != null) {
            try {
                activeOutputStream.close();
            } catch (Exception ignored) {}
            activeOutputStream = null;
        }
        if (activeSocket != null) {
            try {
                activeSocket.close();
            } catch (Exception ignored) {}
            activeSocket = null;
        }
        connectedAddress = null;
        connectedName = null;
    }

    public class AndroidPrinterBridge {

        @JavascriptInterface
        public boolean isNativeAndroid() {
            return true;
        }

        @JavascriptInterface
        public boolean isBluetoothEnabled() {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                return adapter != null && adapter.isEnabled();
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void openBluetoothSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        }

        @JavascriptInterface
        public boolean startDiscovery() {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null || !adapter.isEnabled()) return false;
                if (adapter.isDiscovering()) {
                    adapter.cancelDiscovery();
                }
                return adapter.startDiscovery();
            } catch (SecurityException e) {
                return false;
            }
        }

        @JavascriptInterface
        public String getScannedDevicesJson() {
            JSONArray array = new JSONArray();
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null) return "[]";

                // 1. Bonded / Paired Devices
                try {
                    Set<BluetoothDevice> paired = adapter.getBondedDevices();
                    if (paired != null) {
                        for (BluetoothDevice dev : paired) {
                            JSONObject obj = new JSONObject();
                            String name = dev.getName();
                            String addr = dev.getAddress();
                            obj.put("name", (name != null && !name.isEmpty()) ? name : "Thermal Printer");
                            obj.put("address", addr);
                            obj.put("isPaired", true);
                            obj.put("isConnected", addr.equalsIgnoreCase(connectedAddress));
                            array.put(obj);
                        }
                    }
                } catch (SecurityException ignored) {}

                // 2. Discovered Devices (Avoid duplicating bonded ones)
                for (Map.Entry<String, String> entry : discoveredDevices.entrySet()) {
                    String addr = entry.getKey();
                    boolean exists = false;
                    for (int i = 0; i < array.length(); i++) {
                        if (array.getJSONObject(i).getString("address").equalsIgnoreCase(addr)) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        JSONObject obj = new JSONObject();
                        obj.put("name", entry.getValue());
                        obj.put("address", addr);
                        obj.put("isPaired", false);
                        obj.put("isConnected", addr.equalsIgnoreCase(connectedAddress));
                        array.put(obj);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return array.toString();
        }

        @JavascriptInterface
        public String getConnectedDeviceInfoJson() {
            try {
                JSONObject obj = new JSONObject();
                if (activeSocket != null && activeSocket.isConnected() && connectedAddress != null) {
                    obj.put("connected", true);
                    obj.put("address", connectedAddress);
                    obj.put("name", connectedName != null ? connectedName : "Bluetooth Thermal Printer");
                } else {
                    SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
                    String savedAddr = prefs.getString(KEY_PRINTER_ADDR, "");
                    String savedName = prefs.getString(KEY_PRINTER_NAME, "");
                    obj.put("connected", false);
                    obj.put("address", savedAddr);
                    obj.put("name", savedName);
                }
                return obj.toString();
            } catch (Exception e) {
                return "{\"connected\":false}";
            }
        }

        @JavascriptInterface
        public synchronized boolean connectPrinter(String address, String name) {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null || !adapter.isEnabled()) return false;

                if (adapter.isDiscovering()) {
                    try {
                        adapter.cancelDiscovery();
                    } catch (SecurityException ignored) {}
                }

                closeActiveSocket();

                BluetoothDevice device = adapter.getRemoteDevice(address);
                if (device == null) return false;

                BluetoothSocket socket = null;
                try {
                    socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    socket.connect();
                } catch (Exception ex1) {
                    // Reflection fallback for certain Android vendor bluetooth stacks
                    try {
                        Method m = device.getClass().getMethod("createRfcommSocket", new Class[]{int.class});
                        socket = (BluetoothSocket) m.invoke(device, 1);
                        if (socket != null) {
                            socket.connect();
                        }
                    } catch (Exception ex2) {
                        return false;
                    }
                }

                if (socket != null && socket.isConnected()) {
                    try {
                        Thread.sleep(60); // Allow RFCOMM channel stabilization
                    } catch (InterruptedException ignored) {}

                    activeSocket = socket;
                    activeOutputStream = socket.getOutputStream();
                    connectedAddress = address;
                    connectedName = (name != null && !name.trim().isEmpty()) ? name : (device.getName() != null ? device.getName() : "Bluetooth Printer");

                    SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
                    prefs.edit()
                            .putString(KEY_PRINTER_ADDR, connectedAddress)
                            .putString(KEY_PRINTER_NAME, connectedName)
                            .apply();
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public synchronized boolean disconnectPrinter() {
            closeActiveSocket();
            return true;
        }

        @JavascriptInterface
        public synchronized boolean printRawEscPos(String base64Data) {
            try {
                byte[] data = Base64.decode(base64Data, Base64.DEFAULT);

                // 1. If active Bluetooth socket is open, try direct write
                boolean writeSucceeded = false;
                if (activeSocket != null && activeOutputStream != null) {
                    try {
                        activeOutputStream.write(data);
                        activeOutputStream.flush();
                        writeSucceeded = true;
                    } catch (Exception writeEx) {
                        Log.w("MainActivity", "Direct write failed (printer socket reset/broken pipe after 1st print), resetting: " + writeEx.getMessage());
                        closeActiveSocket();
                    }
                }

                if (writeSucceeded) {
                    return true;
                }

                // 2. Try auto-reconnect to saved printer address if socket dropped
                SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
                String savedAddr = prefs.getString(KEY_PRINTER_ADDR, "");
                String savedName = prefs.getString(KEY_PRINTER_NAME, "Bluetooth Printer");
                if (savedAddr != null && !savedAddr.trim().isEmpty()) {
                    for (int attempt = 1; attempt <= 2; attempt++) {
                        closeActiveSocket();
                        boolean connected = connectPrinter(savedAddr, savedName);
                        if (connected && activeOutputStream != null) {
                            try {
                                activeOutputStream.write(data);
                                activeOutputStream.flush();
                                return true;
                            } catch (Exception retryEx) {
                                Log.w("MainActivity", "Retry write attempt " + attempt + " failed: " + retryEx.getMessage());
                                closeActiveSocket();
                            }
                        }
                        if (attempt == 1) {
                            try { Thread.sleep(250); } catch (InterruptedException ignored) {}
                        }
                    }
                }

                // 3. Fallback: Launch RawBT print intent if socket is unavailable
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse("rawbt:data:application/octet-stream;base64," + base64Data));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    return true;
                } catch (Exception ignored) {}

                return false;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
    }
}
