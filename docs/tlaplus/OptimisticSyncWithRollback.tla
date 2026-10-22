---- MODULE OptimisticSyncWithRollback ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Clients, Cards, Lists

VARIABLES
    clientCards,
    clientSnapshot,
    dbCards,
    dbLists,
    network,
    reqCount

vars == <<clientCards, clientSnapshot, dbCards, dbLists, network, reqCount>>

Init ==
    /\ clientCards = [c \in Clients |-> [card \in Cards |-> "L1"]]
    /\ clientSnapshot = [c \in Clients |-> [card \in Cards |-> "L1"]]
    /\ dbCards = [card \in Cards |-> "L1"]
    /\ dbLists = Lists
    /\ network = {}
    /\ reqCount = 0

\* Action 1: Client saves snapshot, optimistically updates UI, and dispatches server action
ClientDrag(c, card, targetList) ==
    /\ reqCount < 1
    /\ targetList \in Lists
    /\ targetList /= clientCards[c][card]
    /\ clientSnapshot' = [clientSnapshot EXCEPT ![c][card] = clientCards[c][card]]
    /\ clientCards' = [clientCards EXCEPT ![c][card] = targetList]
    /\ network' = network \union {[type |-> "REQ", client |-> c, card |-> card, targetList |-> targetList]}
    /\ reqCount' = reqCount + 1
    /\ UNCHANGED <<dbCards, dbLists>>

\* Action 2: Concurrent deletion of destination list L2 (with DB cascade delete)
ServerDeleteDestList ==
    /\ "L2" \in dbLists
    /\ dbLists' = dbLists \ {"L2"}
    /\ dbCards' = [c \in Cards |-> IF dbCards[c] = "L2" THEN "DELETED" ELSE dbCards[c]]
    /\ UNCHANGED <<clientCards, clientSnapshot, network, reqCount>>

\* Action 3: Server fails if target list was deleted
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
         /\ UNCHANGED <<clientCards, clientSnapshot, dbLists, reqCount>>

\* Action 4: Client receives response with DEFENSIVE ROLLBACK
ClientHandleRespWithRollback ==
    /\ \E msg \in network :
         /\ msg.type = "RESP"
         /\ network' = network \ {msg}
         /\ IF msg.success
            THEN
              \* Success: keep optimistic state
              /\ UNCHANGED clientCards
            ELSE
              \* Failure: Rollback to snapshot!
              /\ clientCards' = [clientCards EXCEPT ![msg.client][msg.card] = clientSnapshot[msg.client][msg.card]]
         /\ UNCHANGED <<clientSnapshot, dbCards, dbLists, reqCount>>

\* Action 5: Client syncs with server (revalidation / query refresh)
ClientSync(c) ==
    /\ network = {}
    /\ clientCards' = [clientCards EXCEPT ![c] = dbCards]
    /\ UNCHANGED <<clientSnapshot, dbCards, dbLists, network, reqCount>>

Next ==
    \/ \E c \in Clients, card \in Cards, l \in Lists : ClientDrag(c, card, l)
    \/ ServerDeleteDestList
    \/ ServerHandleReq
    \/ ClientHandleRespWithRollback
    \/ \E c \in Clients : ClientSync(c)

\* Safety Invariant: When move to deleted destination fails, client must roll back to origin list
RollbackPreservesOriginOnFailure ==
    (network = {} /\ "L2" \notin dbLists /\ dbCards["c1"] = "L1") =>
        clientCards["u1"]["c1"] = "L1"

Spec == Init /\ [][Next]_vars
====
