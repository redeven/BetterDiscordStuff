import { Patcher, Webpack } from "@api";
import manifest from "@manifest";
import Styles from "@styles";
import React from "react";

import showChangelog from "../common/Changelog";
import SettingsPanel from "./components/settings";
import Settings from "./modules/settings";

export default class ReplaceTimestamps {
    start() {
        showChangelog(manifest);
        this.patchMessageActions();
        Styles.load();
    }
    stop() {
        Patcher.unpatchAll();
        Styles.unload();
    }

    patchMessageActions() {
        const MessageActions = Webpack.getByKeys("sendMessage", "editMessage");

        function parseTime(time) {
            const cleanTime = time.slice(1, -1).replace(/(\d)(AM|PM)$/i, "$1 $2");
            let ms = new Date(`${new Date().toDateString()} ${cleanTime}`).getTime() / 1000;
            if (isNaN(ms)) return time;
            if (Date.now() / 1000 > ms) ms += 86400;
            return `<t:${Math.round(ms)}:t>`;
        }

        const processMessageContent = content => content
            .replace(/`\d{1,2}:\d{2} ?(?:AM|PM)?`/gi, parseTime);

        Patcher.before(MessageActions, "sendMessage", (_, [, msg]) => {
            msg.content = processMessageContent(msg.content);
        });

        Patcher.before(MessageActions, "editMessage", (_, [, , msg]) => {
            if (!Settings.get("applyToEdits", true)) return;
            msg.content = processMessageContent(msg.content);
        });
    }

    getSettingsPanel() {
        return <SettingsPanel />;
    }
}
