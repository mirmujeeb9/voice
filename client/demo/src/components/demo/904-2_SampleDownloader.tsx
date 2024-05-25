import React, { useMemo, useState } from "react";
import { useAppState } from "../../001_provider/001_AppStateProvider";
import { DiffusionSVCSampleModel, ModelUploadSetting, RVCSampleModel, VoiceChangerType } from "@dannadori/voice-changer-client-js";
import { useMessageBuilder } from "../../hooks/useMessageBuilder";
import { ModelSlotManagerDialogScreen } from "./904_ModelSlotManagerDialog";

export type SampleDownloaderScreenProps = {
    screen: ModelSlotManagerDialogScreen;
    targetIndex: number;
    close: () => void;
    backToSlotManager: () => void;
};

export const SampleDownloaderScreen = (props: SampleDownloaderScreenProps) => {
    const { serverSetting } = useAppState();
    const [lang, setLang] = useState<string>("All");
    const messageBuilderState = useMessageBuilder();
    useMemo(() => {
        messageBuilderState.setMessage(__filename, "header_message", { ja: "サンプルをダウンロードしてください. 対象：", en: "Download Sample for" });
        messageBuilderState.setMessage(__filename, "lang", { ja: "言語", en: "Lang" });
        messageBuilderState.setMessage(__filename, "back", { ja: "戻る", en: "back" });
        messageBuilderState.setMessage(__filename, "terms_of_use", { ja: "利用規約", en: "terms of use" });
        messageBuilderState.setMessage(__filename, "download", { ja: "ダウンロード", en: "download" });
    }, []);

    /////////////////////////////////////////
    // Sample Downloader
    /////////////////////////////////////////
    const screen = useMemo(() => {
        if (props.screen != "SampleDownloader") {
            return <></>;
        }
        if (!serverSetting.serverSetting.modelSlots) {
            return <></>;
        }

        const langs = serverSetting.serverSetting.sampleModels.reduce(
            (prev, cur) => {
                if (prev.includes(cur.lang) == false) {
                    prev.push(cur.lang);
                }
                return prev;
            },
            ["All"] as string[],
        );
        const langOptions = langs.map((x) => {
            return (
                <option key={x} value={x}>
                    {x}
                </option>
            );
        });
        const onDownloadSampleClicked = async (id: string, voiceChangerType: VoiceChangerType, params: any) => {
            const uploadParams: ModelUploadSetting = {
                voiceChangerType: voiceChangerType,
                slot: props.targetIndex,
                isSampleMode: true,
                sampleId: id,
                files: [],
                params: params,
            };
            try {
                await serverSetting.uploadModel(uploadParams);
            } catch (e) {
                alert(e);
            }
            props.backToSlotManager();
            // setMode("localFile")
        };
        const options = serverSetting.serverSetting.sampleModels
            .filter((x) => {
                return lang == "All" ? true : x.lang == lang;
            })
            .map((x, index) => {
                const termOfUseUrlLink =
                    x.termsOfUseUrl && x.termsOfUseUrl.length > 0 ? (
                        <a href={x.termsOfUseUrl} target="_blank" rel="noopener noreferrer" className="body-item-text-small">
                            [{messageBuilderState.getMessage(__filename, "terms_of_use")}]
                        </a>
                    ) : (
                        <></>
                    );

                let info = ``;
                if (x.voiceChangerType == "RVC") {
                    const sampleInfo = x as RVCSampleModel;
                    info = `type:${sampleInfo.modelType}, f0:${sampleInfo.f0 ? "f0" : "nof0"}, sr:${sampleInfo.sampleRate}`;
                } else if (x.voiceChangerType == "Diffusion-SVC") {
                    const sampleInfo = x as DiffusionSVCSampleModel;
                    info = `native_l:${sampleInfo.numOfNativeLayers}, diff_l:${sampleInfo.numOfDiffLayers}, max_kstep:${sampleInfo.maxKStep}`;
                }
                return (
                    <div key={index} className="model-slot">
                        <img src={x.icon} className="model-slot-icon"></img>
                        <div className="model-slot-detail">
                            <div className="model-slot-detail-row">
                                <div className="model-slot-detail-row-label">name:</div>
                                <div className="model-slot-detail-row-value">{x.name}</div>
                                <div className="">{termOfUseUrlLink}</div>
                            </div>
                            <div className="model-slot-detail-row">
                                <div className="model-slot-detail-row-label">VC Type: </div>
                                <div className="model-slot-detail-row-value">{x.voiceChangerType}</div>
                                <div className=""></div>
                            </div>
                            <div className="model-slot-detail-row">
                                <div className="model-slot-detail-row-label">info: </div>
                                <div className="model-slot-detail-row-value">{info}</div>
                                <div className=""></div>
                            </div>
                        </div>
                        <div className="model-slot-buttons">
                            <div
                                className="model-slot-button"
                                onClick={() => {
                                    if (x.voiceChangerType == "RVC") {
                                        onDownloadSampleClicked(x.id, x.voiceChangerType, {
                                            useIndex: true,
                                        });
                                    } else if (x.voiceChangerType == "Diffusion-SVC") {
                                        onDownloadSampleClicked(x.id, x.voiceChangerType, {});
                                    }
                                }}
                            >
                                {messageBuilderState.getMessage(__filename, "download")}
                            </div>
                        </div>
                    </div>
                );
            });

        return (
            <div className="dialog-frame">
                <div className="dialog-title">Sample Downloader</div>
                <div className="dialog-fixed-size-content">
                    <div className="model-slot-header">
                        {messageBuilderState.getMessage(__filename, "header_message")} Slot[{props.targetIndex}]
                        <span
                            onClick={() => {
                                props.backToSlotManager();
                            }}
                            className="model-slot-header-button"
                        >
                            &lt;&lt;{messageBuilderState.getMessage(__filename, "back")}
                        </span>
                    </div>
                    <div>
                        {messageBuilderState.getMessage(__filename, "lang")}:
                        <select
                            value={lang}
                            onChange={(e) => {
                                setLang(e.target.value);
                            }}
                        >
                            {langOptions}
                        </select>
                    </div>

                    <div className="model-slot-container">{options}</div>
                </div>
            </div>
        );
    }, [props.screen, props.targetIndex, lang, serverSetting.serverSetting]);

    return screen;
};
