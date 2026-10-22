---- MODULE OptimisticSyncNoRollback ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Clients, Cards, Lists

VARIABLES
    clientCards,
    dbCards,
    dbLists,
    network,
    reqCount

vars == <<clientCards, dbCards, dbLists, network, reqCount>>

Init ==
    /\ clientCards = [c \in Clients |-> [card \in Cards |-> "L1"]]
    /\ dbCards = [card \in Cards |-> "L1"]
    /\ dbLists = Lists
    /\ network = {}
    /\ reqCount = 0

\* Action 1: Client optimistically updates UI and fires server action (as in current board-canvas.tsx)
ClientDrag(c, card, targetList) ==
    /\ reqCount < 1
    /\ targetList \in Lists
    /\ targetList /= clientCards[c][card]
    /\ clientCards' = [clientCards EXCEPT ![c][card] = targetList]
    /\ network' = network \union {[type |-> "REQ", client |-> c, card |-> card, targetList |-> targetList]}
    /\ reqCount' = reqCount + 1
    /\ UNCHANGED <<dbCards, dbLists>>

\* Action 2: Concurrent deletion of destination list L2
ServerDeleteDestList ==
    /\ "L2" \in dbLists
    /\ dbLists' = dbLists \ {"L2"}
    /\ UNCHANGED <<clientCards, dbCards, network, reqCount>>

\* Action 3: Server fails because target list was deleted
ServerHandleReq ==
    /\ \E msg \in network :
         /\ msg.type = "REQ"
         /\ IF msg.targetList \in dbLists
            THEN
              /\ dbCards' = [dbCards EXCEPT ![msg.card] = msg.targetList]
              /\ network' = (network \ {msg}) \union {[type |-> "RESP", client |-> msg.client, card |-> msg.card, success |-> TRUE]}
            ELSE
              \* Target list missing -> returns error
              /\ network' = (network \ {msg}) \union {[type |-> "RESP", client |-> msg.client, card |-> msg.card, success |-> FALSE]}
              /\ UNCHANGED dbCards
         /\ UNCHANGED <<clientCards, dbLists, reqCount>>

\* Action 4: Client receives error, but has NO rollback logic (as in current board-canvas.tsx)
ClientHandleRespNoRollback ==
    /\ \E msg \in network :
         /\ msg.type = "RESP"
         /\ network' = network \ {msg}
         \* Unhandled failure: Client leaves optimistic state in place!
         /\ UNCHANGED <<clientCards, dbCards, dbLists, reqCount>>

Next ==
    \/ \E c \in Clients, card \in Cards, l \in Lists : ClientDrag(c, card, l)
    \/ ServerDeleteDestList
    \/ ServerHandleReq
    \/ ClientHandleRespNoRollback

\* Safety Invariant: When move to deleted destination fails, client must roll back to origin list
RollbackPreservesOriginOnFailure ==
    (network = {} /\ "L2" \notin dbLists /\ dbCards["c1"] = "L1") =>
        clientCards["u1"]["c1"] = "L1"

Spec == Init /\ [][Next]_vars
====
