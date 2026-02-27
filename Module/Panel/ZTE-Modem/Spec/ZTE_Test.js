/*
* ZTE Modem Monitor Panel - Universal Version (Debug Edition)
* GitHub: Rabbit-Spec/ZTE-Modem-TimeSync-Shortcut
*/

const IP = "192.168.1.1";
const USER = "root";
const PASS = "Zte521";
const EXPECT_PATH = "/opt/homebrew/bin/expect"; 

// 抓取当前真实的系统环境标识
const envSys = typeof $environment !== "undefined" ? $environment.system : "Undefined";
const hasUtilsExec = typeof $utils !== "undefined" && typeof $utils.exec === "function";

// 放宽判断：只要系统名称包含 "mac" (忽略大小写)，或者有 exec 权限，就认为是 Mac
const isMac = (envSys.toLowerCase().includes("mac")) || hasUtilsExec;

if (isMac) {
    if (!hasUtilsExec) {
        // 如果识别为 Mac，但没有执行权限，抛出详细错误
        $done({
            title: "Mac 权限受限",
            content: `系统识别为: ${envSys}\n错误: 当前 Surge 缺少 $utils.exec API，无法运行本地命令。`,
            icon: "xmark.octagon",
            "icon-color": "#FF3B30"
        });
        return;
    }

    const cmd = `${EXPECT_PATH} -c 'set timeout 5; spawn telnet ${IP}; expect "Login:"; send "${USER}\\r"; expect "Password:"; send "${PASS}\\r"; expect "/ # "; send "uptime; top -n 1 | grep CPU; cat /proc/pon_info\\r"; expect "/ # "; send "exit\\r"; expect eof'`;

    $utils.exec("bash", ["-c", cmd], (stdout, stderr) => {
        if (stdout) {
            const rxPower = stdout.match(/Rx Power\s+:\s+([-\d.]+)/)?.[1] || "N/A";
            const cpuUsage = stdout.match(/CPU:\s+([\d.]+%)/)?.[1] || "N/A";
            const uptime = stdout.match(/up\s+([\d\s\w,:]+),/)?.[1] || "N/A";

            const content = `🌡 光衰: ${rxPower} dBm  |  💻 CPU: ${cpuUsage}\n⏱ 运行时间: ${uptime}`;
            
            // 写入缓存同步
            $persistentStore.write(content, "ZTE_Modem_Data");

            $done({
                title: "中兴光猫状态 (Mac)",
                content: content,
                icon: "router",
                "icon-color": "#007AFF"
            });
        } else {
            $done({
                title: "中兴光猫 (连接异常)",
                content: "请检查 Mac 端 Telnet 权限及 expect 路径",
                icon: "exclamationmark.triangle",
                "icon-color": "#FF3B30"
            });
        }
    });
} else {
    // 如果不是 Mac，进入消费者模式，并打印诊断信息
    const cachedData = $persistentStore.read("ZTE_Modem_Data");
    $done({
        title: `设备识别为: ${envSys}`,
        content: `API 状态: exec=${hasUtilsExec}\n---\n${cachedData ? cachedData : "⏳ 待同步：请先在 Mac 端运行"}`,
        icon: "iphone",
        "icon-color": "#34C759"
    });
}