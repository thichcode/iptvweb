__PACKAGE_NAME__

import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "AppUpdate")
public class UpdatePlugin extends Plugin {

    private BroadcastReceiver downloadReceiver;

    @Override
    public void load() {
        super.load();
        registerDownloadReceiver();
    }

    private void registerDownloadReceiver() {
        if (downloadReceiver != null) return;
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(action)) {
                    long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (downloadId == -1) return;

                    DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                    boolean successful = false;
                    if (downloadManager != null) {
                        DownloadManager.Query query = new DownloadManager.Query();
                        query.setFilterById(downloadId);
                        Cursor cursor = downloadManager.query(query);
                        if (cursor != null) {
                            if (cursor.moveToFirst()) {
                                int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                                if (statusIdx != -1 && cursor.getInt(statusIdx) == DownloadManager.STATUS_SUCCESSFUL) {
                                    successful = true;
                                }
                            }
                            cursor.close();
                        }
                    }

                    if (successful) {
                        JSObject ret = new JSObject();
                        ret.put("downloadId", downloadId);
                        notifyListeners("apkDownloadComplete", ret);
                    }
                }
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(downloadReceiver, filter);
        }
    }

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        try {
            Context context = getContext();
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pInfo.getLongVersionCode();
            } else {
                versionCode = pInfo.versionCode;
            }
            JSObject ret = new JSObject();
            ret.put("versionName", pInfo.versionName);
            ret.put("versionCode", versionCode);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get app version: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isApkDownloaded(PluginCall call) {
        String fileName = call.getString("fileName");
        String version = call.getString("version");
        if (fileName == null || fileName.isEmpty()) {
            call.reject("fileName is required");
            return;
        }

        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences("wp_updates", Context.MODE_PRIVATE);
            String savedVer = prefs.getString("downloaded_version_" + fileName, "");

            // If a specific version is queried, verify it matches
            if (version != null && !version.isEmpty() && !version.equals(savedVer)) {
                JSObject ret = new JSObject();
                ret.put("downloaded", false);
                ret.put("reason", "version_mismatch");
                call.resolve(ret);
                return;
            }

            // Check if still actively downloading
            long downloadId = prefs.getLong("download_id_" + fileName, -1);
            if (downloadId != -1) {
                DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm != null) {
                    DownloadManager.Query q = new DownloadManager.Query();
                    q.setFilterById(downloadId);
                    Cursor c = dm.query(q);
                    if (c != null) {
                        if (c.moveToFirst()) {
                            int statusIdx = c.getColumnIndex(DownloadManager.COLUMN_STATUS);
                            if (statusIdx != -1) {
                                int status = c.getInt(statusIdx);
                                if (status == DownloadManager.STATUS_RUNNING || status == DownloadManager.STATUS_PENDING) {
                                    c.close();
                                    JSObject ret = new JSObject();
                                    ret.put("downloaded", false);
                                    ret.put("downloading", true);
                                    call.resolve(ret);
                                    return;
                                }
                            }
                        }
                        c.close();
                    }
                }
            }

            File downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            File apkFile = new File(downloadDir, fileName);
            boolean exists = apkFile.exists() && apkFile.isFile() && apkFile.length() > 1024 * 1024; // > 1MB

            JSObject ret = new JSObject();
            ret.put("downloaded", exists);
            ret.put("path", apkFile.getAbsolutePath());
            ret.put("size", apkFile.length());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to check APK: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startDownload(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName");
        String version = call.getString("version", "");
        String title = call.getString("title", "Cập nhật ứng dụng WebPhim");

        if (url == null || url.isEmpty() || fileName == null || fileName.isEmpty()) {
            call.reject("url and fileName are required");
            return;
        }

        try {
            Context context = getContext();
            File downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (downloadDir != null && !downloadDir.exists()) {
                downloadDir.mkdirs();
            }
            File apkFile = new File(downloadDir, fileName);
            if (apkFile.exists()) {
                apkFile.delete();
            }

            DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(title);
            request.setDescription("Đang tải file cập nhật APK...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationUri(Uri.fromFile(apkFile));
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

            long downloadId = downloadManager.enqueue(request);

            // Record downloaded version and downloadId
            SharedPreferences prefs = context.getSharedPreferences("wp_updates", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("downloaded_version_" + fileName, version)
                .putLong("download_id_" + fileName, downloadId)
                .apply();

            JSObject ret = new JSObject();
            ret.put("downloadId", downloadId);
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Download failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String fileName = call.getString("fileName");
        if (fileName == null || fileName.isEmpty()) {
            call.reject("fileName is required");
            return;
        }

        try {
            Context context = getContext();
            File downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            File apkFile = new File(downloadDir, fileName);

            if (!apkFile.exists() || apkFile.length() < 1024 * 1024) {
                call.reject("APK file not found or corrupted");
                return;
            }

            // Check REQUEST_INSTALL_PACKAGES permission on Android 8.0+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.getPackageManager().canRequestPackageInstalls()) {
                    Intent manageIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    manageIntent.setData(Uri.parse("package:" + context.getPackageName()));
                    manageIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try {
                        context.startActivity(manageIntent);
                    } catch (ActivityNotFoundException anf) {
                        try {
                            context.startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                        } catch (Exception ignored) {}
                    }
                    JSObject ret = new JSObject();
                    ret.put("needsPermission", true);
                    call.resolve(ret);
                    return;
                }
            }

            String authority = context.getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(context, authority, apkFile);

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(installIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to trigger install: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {}
            downloadReceiver = null;
        }
    }
}
