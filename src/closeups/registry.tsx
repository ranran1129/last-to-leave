import type { ComponentType } from 'react';
import * as D from './docs';
import * as A from './devicesA';
import * as B from './devicesB';

export interface CloseupDef {
  title: string;
  /** doc = paper/HTML column, device = 4:3 box, wide = 16:9 box */
  kind: 'doc' | 'device' | 'wide';
  /** can be saved to the phone's photo roll */
  photo?: boolean;
  View: ComponentType<{ photo?: boolean }>;
}

export const CLOSEUPS: Record<string, CloseupDef> = {
  // items
  'item:ticket': { title: 'チケット', kind: 'doc', photo: true, View: D.TicketView },
  'item:penlight': { title: 'ペンライト', kind: 'device', View: D.PenlightView },
  'item:drum': { title: '電源ドラム', kind: 'doc', View: D.DrumView },
  'item:silvertape': { title: '銀テープ', kind: 'doc', View: D.SilverTapeView },
  // arena
  announce6: { title: '規制退場 案内原稿⑥', kind: 'doc', photo: true, View: D.Announce6View },
  cases: { title: 'ステージ前のケース', kind: 'wide', photo: true, View: D.CasesView },
  fohsheet: { title: '退場確認（客席側）', kind: 'doc', photo: true, View: D.FohSheetView },
  p1panel: { title: '規制退場パネル', kind: 'device', View: A.P1Panel },
  soundDesk: { title: '音響卓 ルーティング', kind: 'wide', View: B.SoundDesk },
  lightDesk: { title: '照明卓 Q48', kind: 'wide', View: B.LightDesk },
  // lobby
  gateDisplay: { title: 'ゲート表示', kind: 'wide', View: D.GateDisplayView },
  merchBoard: { title: '物販 商品ボード', kind: 'device', photo: true, View: A.MerchBoard },
  merchNotes: { title: '完売の付箋', kind: 'doc', photo: true, View: D.MerchNotesView },
  doorNote: { title: 'ストック室のメモ', kind: 'doc', photo: true, View: D.DoorNoteView },
  dirLock: { title: '方向錠', kind: 'device', View: A.DirLock },
  stands: { title: '回収待ちの祝花', kind: 'wide', photo: true, View: A.StandsView },
  rack: { title: '扉開放ボックス', kind: 'wide', View: A.CardRack },
  // backstage
  whiteboard: { title: '撤収ボード', kind: 'doc', photo: true, View: D.WhiteboardView },
  stageSheet: { title: '退場確認（舞台側）', kind: 'doc', photo: true, View: D.StageSheetView },
  glowRoll: { title: '蓄光テープ', kind: 'doc', photo: true, View: D.GlowRollView },
  stageFloor: { title: 'ステージの床', kind: 'wide', photo: true, View: B.StageFloor },
  truckList: { title: '積込チェック表', kind: 'doc', photo: true, View: D.TruckListView },
  distro: { title: '仮設分電盤', kind: 'wide', View: B.Distro },
  dockPanel: { title: '館内制御盤', kind: 'wide', View: B.DockPanel },
  truckChalk: { title: '荷台のチョーク', kind: 'wide', View: D.TruckChalkView },
  // phone photos
  preshow: { title: '16:38 ロビーの祝花', kind: 'wide', View: D.PreshowView },
  penlights: { title: '20:52 公演中', kind: 'wide', View: D.PenlightsPhotoView },
  sheetOverlay: { title: '重ねた2枚', kind: 'doc', View: D.SheetOverlayView },
};
