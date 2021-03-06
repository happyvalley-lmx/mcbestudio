import { frameRate } from "../Const";
import { CustomConsole } from "../Utils/CustomConsole";
import { CurrentClient } from "./CurrentClient";
import { PositionRotationObject, IMarker, TimelineElement } from "../Interfaces";
import { sendTimelineUpdate, summonPlayerFollower } from "../Utils/Common";
import { CommonServerVariables } from "./CommonServerVariables";
export class ServerTimeline {

  console: CustomConsole = new CustomConsole(this._serverSystem);
  constructor(private _serverSystem: IVanillaServerSystem) {
  }

  goToFirstFrame(currentClient: CurrentClient) {
    currentClient.currentPosition = 0;
    currentClient.currentKeyframe = currentClient.timeline.find((keyframe: TimelineElement) => keyframe !== undefined && keyframe.previous == -1);
    this.updatePositionPlayerFromFrame(currentClient);
  }

  goToLastFrame(currentClient: CurrentClient) {
    currentClient.currentPosition = (currentClient.timeline.length - 1) * frameRate;
    currentClient.currentKeyframe = currentClient.timeline.find((keyframe: TimelineElement) => keyframe !== undefined && keyframe.next == -1);
    this.updatePositionPlayerFromFrame(currentClient);
  }

  goToNextFrame(currentClient: CurrentClient) {
    if (currentClient.currentKeyframe === null) {
      this.goToFirstFrame(currentClient);
    }
    let newPosition: number = (Math.trunc(currentClient.currentPosition / frameRate) + 1) * frameRate
    currentClient.currentPosition = newPosition;
    let newCurrentKeyframeid = currentClient.currentKeyframe.next;
    currentClient.currentKeyframe = currentClient.timeline.find((keyframe: TimelineElement) => keyframe !== undefined && keyframe.current == newCurrentKeyframeid);
    if (currentClient.currentKeyframe && currentClient.timelineExtended[newCurrentKeyframeid * frameRate] && currentClient.timelineExtended.length > 0) {
      currentClient.currentKeyframe.positionComponent = currentClient.timelineExtended[newCurrentKeyframeid * frameRate].positionComponent;
      currentClient.currentKeyframe.rotationComponent = currentClient.timelineExtended[newCurrentKeyframeid * frameRate].rotationComponent;
    }
    this.updatePositionPlayerFromFrame(currentClient);
  }

  goToPreviousFrame(currentClient: CurrentClient) {
    if (currentClient.currentKeyframe === null) {
      this.goToLastFrame(currentClient);
    }
    let newPosition: number = (Math.trunc(currentClient.currentPosition / frameRate) - 1) * frameRate
    if (newPosition < 0) {
      this.goToFirstFrame(currentClient);
      return;
    }
    currentClient.currentPosition = newPosition;
    let newCurrentKeyframeid = currentClient.currentKeyframe.previous;
    currentClient.currentKeyframe = currentClient.timeline.find((keyframe: TimelineElement) => keyframe !== undefined && keyframe.current == newCurrentKeyframeid);
    if (currentClient.currentKeyframe && currentClient.timelineExtended[newCurrentKeyframeid * frameRate] && currentClient.timelineExtended.length > 0) {
      currentClient.currentKeyframe.positionComponent = currentClient.timelineExtended[newCurrentKeyframeid * frameRate].positionComponent;
      currentClient.currentKeyframe.rotationComponent = currentClient.timelineExtended[newCurrentKeyframeid * frameRate].rotationComponent;
    }
    this.updatePositionPlayerFromFrame(currentClient);
  }

  goToPlay(currentClient: CurrentClient, isFullScreen: boolean) {
    if (currentClient.currentKeyframe === null) {
      this.goToFirstFrame(currentClient);
    }
    if (isFullScreen) {
      currentClient.isPlayingSequenceFullScreen = true;
      summonPlayerFollower(this._serverSystem, currentClient);
    } else {
      currentClient.isPlayingSequenceFullScreen = false;
    }
    currentClient.isPlayingSequence = true;
  }

  goToPause(currentClient: CurrentClient) {
    currentClient.isPlayingSequence = false;
  }

  updatePositionPlayerFromFrame(currentClient: CurrentClient) {
    if (currentClient.currentKeyframe) {
      this._serverSystem.applyComponentChanges(currentClient.player, currentClient.currentKeyframe.positionComponent);
      this._serverSystem.applyComponentChanges(currentClient.player, currentClient.currentKeyframe.rotationComponent);
    }
    sendTimelineUpdate(this._serverSystem, currentClient.player.id, currentClient.currentPosition);
  }
}