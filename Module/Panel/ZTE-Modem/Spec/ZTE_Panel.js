/*
* ZTE Modem Monitor Panel for Surge
* 适配型号: G100P-17N3
* GitHub: Rabbit-Spec/ZTE-Modem-TimeSync-Shortcut
*/

const IP = "192.168.1.1";
const USER = "root";
const PASS = "Zte521";

// 直接通过 expect -c 执行单行自动化命令，无需引用本地 .sh 文件
const cmd = `expect -c '
set timeout 5;
spawn telnet ${IP};
expect "Login:"; send "${USER}\\r";
expect "Password:"; send "${PASS}\\r";
expect "/ # "; send "uptime; top -n 1 | grep CPU; cat /proc/pon_info\\r";
expect "/ # "; send "exit\\r";
expect eof'`;

$utils.exec("bash", ["-c", cmd], (stdout, stderr) => {
    if (stdout) {
        const rxPower = stdout.match(/Rx Power\s+:\s+([-\d.]+)/)?.[1] || "N/A";
        const cpuUsage = stdout.match(/CPU:\s+([\d.]+%)/)?.[1] || "N/A";
        const uptime = stdout.match(/up\s+([\d\s\w,:]+),/)?.[1] || "N/A";

        $done({
            title: "中兴光猫状态",
            content: `🌡 光衰: ${rxPower} dBm  |  💻 CPU: ${cpuUsage}\n⏱ 运行时间: ${uptime}`,
            icon: "router",
            "icon-color": "#007AFF"
        });
    } else {
        $done({
            title: "连接失败",
            content: "请检查 Telnet 权限",
            icon: "exclamationmark.triangle",
            "icon-color": "#FF3B30"
        });
    }
});