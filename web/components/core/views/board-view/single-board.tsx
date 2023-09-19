import { useState } from "react";

import { useRouter } from "next/router";

// react-beautiful-dnd
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable } from "react-beautiful-dnd";
// components
import { BoardHeader, SingleBoardIssue } from "components/core";
// ui
import { CustomMenu } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssue, IIssueViewProps, IState, UserAuth } from "types";

type Props = {
  addIssueToGroup: () => void;
  currentState?: IState | null;
  disableUserActions: boolean;
  disableAddIssueOption?: boolean;
  dragDisabled: boolean;
  groupTitle: string;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleDraftIssueAction?: (issue: IIssue, action: "edit" | "delete") => void;
  handleTrashBox: (isDragging: boolean) => void;
  openIssuesListModal?: (() => void) | null;
  handleMyIssueOpen?: (issue: IIssue) => void;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const SingleBoard: React.FC<Props> = ({
  addIssueToGroup,
  currentState,
  groupTitle,
  disableUserActions,
  disableAddIssueOption = false,
  dragDisabled,
  handleIssueAction,
  handleDraftIssueAction,
  handleTrashBox,
  openIssuesListModal,
  handleMyIssueOpen,
  removeIssue,
  user,
  userAuth,
  viewProps,
}) => {
  // collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { displayFilters, groupedIssues } = viewProps;

  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  // Check if it has at least 4 tickets since it is enough to accommodate the Calendar height
  const issuesLength = groupedIssues?.[groupTitle].length;
  const hasMinimumNumberOfCards = issuesLength ? issuesLength >= 4 : false;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disableUserActions;

  return (
    <div className={`flex-shrink-0 ${!isCollapsed ? "" : "flex h-full flex-col w-96"}`}>
      <BoardHeader
        addIssueToGroup={addIssueToGroup}
        currentState={currentState}
        groupTitle={groupTitle}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        disableUserActions={disableUserActions}
        disableAddIssue={disableAddIssueOption}
        viewProps={viewProps}
      />
      {isCollapsed && (
        <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
          {(provided, snapshot) => (
            <div
              className={`relative h-full ${
                displayFilters?.order_by !== "sort_order" && snapshot.isDraggingOver
                  ? "bg-custom-background-100/20"
                  : ""
              } ${!isCollapsed ? "hidden" : "flex flex-col"}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {displayFilters?.order_by !== "sort_order" && (
                <>
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } pointer-events-none top-0 left-0 z-[99] h-full w-full bg-custom-background-90 opacity-50`}
                  />
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } pointer-events-none top-1/2 left-1/2 z-[99] -translate-y-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-custom-background-100 p-2 text-xs`}
                  >
                    This board is ordered by{" "}
                    {replaceUnderscoreIfSnakeCase(
                      displayFilters?.order_by
                        ? displayFilters?.order_by[0] === "-"
                          ? displayFilters?.order_by.slice(1)
                          : displayFilters?.order_by
                        : "created_at"
                    )}
                  </div>
                </>
              )}
              <div
                className={`pt-3 ${
                  hasMinimumNumberOfCards ? "overflow-hidden overflow-y-scroll" : ""
                } `}
              >
                {groupedIssues?.[groupTitle].map((issue, index) => (
                  <Draggable
                    key={issue.id}
                    draggableId={issue.id}
                    index={index}
                    isDragDisabled={isNotAllowed || dragDisabled}
                  >
                    {(provided, snapshot) => (
                      <SingleBoardIssue
                        key={index}
                        provided={provided}
                        snapshot={snapshot}
                        type={type}
                        index={index}
                        issue={issue}
                        groupTitle={groupTitle}
                        editIssue={() => handleIssueAction(issue, "edit")}
                        makeIssueCopy={() => handleIssueAction(issue, "copy")}
                        handleDeleteIssue={() => handleIssueAction(issue, "delete")}
                        handleDraftIssueEdit={
                          handleDraftIssueAction
                            ? () => handleDraftIssueAction(issue, "edit")
                            : undefined
                        }
                        handleDraftIssueDelete={() =>
                          handleDraftIssueAction
                            ? handleDraftIssueAction(issue, "delete")
                            : undefined
                        }
                        handleTrashBox={handleTrashBox}
                        handleMyIssueOpen={handleMyIssueOpen}
                        removeIssue={() => {
                          if (removeIssue && issue.bridge_id)
                            removeIssue(issue.bridge_id, issue.id);
                        }}
                        disableUserActions={disableUserActions}
                        user={user}
                        userAuth={userAuth}
                        viewProps={viewProps}
                      />
                    )}
                  </Draggable>
                ))}
                <span
                  style={{
                    display: displayFilters?.order_by === "sort_order" ? "inline" : "none",
                  }}
                >
                  <>{provided.placeholder}</>
                </span>
              </div>
              {displayFilters?.group_by !== "created_by" && (
                <div>
                  {type === "issue"
                    ? !disableAddIssueOption && (
                        <button
                          type="button"
                          className="flex items-center gap-2 font-medium text-custom-primary outline-none p-1"
                          onClick={addIssueToGroup}
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add Issue
                        </button>
                      )
                    : !disableUserActions && (
                        <CustomMenu
                          customButton={
                            <button
                              type="button"
                              className="flex items-center gap-2 font-medium text-custom-primary outline-none whitespace-nowrap"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Add Issue
                            </button>
                          }
                          position="left"
                          noBorder
                        >
                          <CustomMenu.MenuItem onClick={addIssueToGroup}>
                            Create new
                          </CustomMenu.MenuItem>
                          {openIssuesListModal && (
                            <CustomMenu.MenuItem onClick={openIssuesListModal}>
                              Add an existing issue
                            </CustomMenu.MenuItem>
                          )}
                        </CustomMenu>
                      )}
                </div>
              )}
            </div>
          )}
        </StrictModeDroppable>
      )}
    </div>
  );
};
