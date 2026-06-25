import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:vibration/vibration.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AttendanceScannerApp());
}

class AttendanceScannerApp extends StatelessWidget {
  const AttendanceScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: ScannerScreen(),
    );
  }
}

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _showMarkedMessage = false;
  String _alertMessage = 'Attendance matched and marked';
  bool _isSuccess = true;

  // Connection settings
  String _backendUrl = 'http://10.0.2.2:5000'; // Default Android emulator host loopback
  String _sessionId = 'active-session-id';
  String _authToken = 'mock-auth-token';

  // Offline cache
  final List<Map<String, dynamic>> _offlineScans = [];

  void _onDetect(Barcode barcode, MobileScannerArguments? args) async {
    if (_showMarkedMessage) return;

    final String? rawValue = barcode.rawValue;

    if (rawValue != null && rawValue.isNotEmpty) {
      if (await Vibration.hasVibrator() ?? false) {
        Vibration.vibrate(duration: 200);
      }

      await _markAttendanceOnBackend(rawValue);
    }
  }

  Future<void> _markAttendanceOnBackend(String barcodeValue) async {
    final url = Uri.parse('$_backendUrl/api/attendance/mark');
    
    final payload = {
      'sessionId': _sessionId,
      'barcodeValue': barcodeValue,
      'method': 'BARCODE',
    };

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_authToken',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        setState(() {
          _isSuccess = true;
          _alertMessage = 'Attendance Marked: $barcodeValue';
          _showMarkedMessage = true;
        });
      } else {
        final Map<String, dynamic> errorData = jsonDecode(response.body);
        setState(() {
          _isSuccess = false;
          _alertMessage = errorData['error'] ?? 'Marking Failed';
          _showMarkedMessage = true;
        });
      }
    } catch (e) {
      // Offline fallback: cache it
      final offlineData = {
        ...payload,
        'timestamp': DateTime.now().toIso8601String(),
      };
      _offlineScans.add(offlineData);
      
      setState(() {
        _isSuccess = true;
        _alertMessage = 'Offline Cached: $barcodeValue';
        _showMarkedMessage = true;
      });
    }

    await Future.delayed(const Duration(seconds: 3));
    setState(() {
      _showMarkedMessage = false;
    });
  }

  void _showSettingsDialog() {
    final urlController = TextEditingController(text: _backendUrl);
    final sessionController = TextEditingController(text: _sessionId);
    final tokenController = TextEditingController(text: _authToken);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('API Connection Settings'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: urlController,
                  decoration: const InputDecoration(labelText: 'Backend URL'),
                ),
                TextField(
                  controller: sessionController,
                  decoration: const InputDecoration(labelText: 'Class Session ID'),
                ),
                TextField(
                  controller: tokenController,
                  decoration: const InputDecoration(labelText: 'Auth Token (JWT)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _backendUrl = urlController.text;
                  _sessionId = sessionController.text;
                  _authToken = tokenController.text;
                });
                Navigator.pop(context);
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  void _syncOfflineScans() async {
    if (_offlineScans.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No offline records cached')),
      );
      return;
    }

    int successCount = 0;
    List<Map<String, dynamic>> failedScans = [];

    for (var scan in _offlineScans) {
      try {
        final response = await http.post(
          Uri.parse('$_backendUrl/api/attendance/mark'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $_authToken',
          },
          body: jsonEncode({
            'sessionId': scan['sessionId'],
            'barcodeValue': scan['barcodeValue'],
            'method': scan['method'],
          }),
        );
        if (response.statusCode == 201 || response.statusCode == 200) {
          successCount++;
        } else {
          failedScans.add(scan);
        }
      } catch (e) {
        failedScans.add(scan);
      }
    }

    setState(() {
      _offlineScans.clear();
      _offlineScans.addAll(failedScans);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Synced $successCount scans. ${failedScans.length} failed.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Scanner'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: _syncOfflineScans,
            tooltip: 'Sync Offline Scans (${_offlineScans.length})',
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showSettingsDialog,
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            allowDuplicates: false,
            onDetect: _onDetect,
          ),
          if (_showMarkedMessage)
            Container(
              color: Colors.black54,
              alignment: Alignment.center,
              child: DefaultTextStyle(
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: _isSuccess ? Colors.greenAccent : Colors.redAccent,
                ),
                child: AnimatedTextKit(
                  animatedTexts: [
                    TypewriterAnimatedText(
                      _alertMessage,
                      speed: const Duration(milliseconds: 70),
                    ),
                  ],
                  totalRepeatCount: 1,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
