---- MODULE OptimisticReorderSync ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Clients, Cards, Lists

VARIABLES
    clientCards,        \* [Clients -> [Cards -> Lists]]
    clientPending,      \* [Clients -> [Cards -> [active: BOOLEAN, seq: Nat, snapshot: Lists]]]
    clientSeq,          \* [Clients -> Nat]
    lastAckSeq,         \* [Clients -> Nat]
    dbCards,            \* [Cards -> Lists]
    dbLists,            \* Subset of Lists currently existing in DB
    network             \* Set of messages in flight

vars == <<clientCards, clientPending, clientSeq, lastAckSeq, dbCards, dbLists, network>>

\* Message types
MsgReq(c, seq, card, targetList) ==
    [type |-> "REQ", client |-> c, seq |-> seq, card |-> card, targetList |-> targetList]

MsgResp(c, seq, card, success, targetList) ==
    [type |-> "RESP", client |-> c, seq |-> seq, card |-> card, success |-> success, targetList |-> targetList]

Init ==
    /\ clientCards = [c \in Clients |-> [card \in Cards |-> "L1"]]
    /\ clientPending = [c \in Clients |-> [card \in Cards |-> [active |-> FALSE, seq |-> 0, snapshot |-> "L1"]]]
    /\ clientSeq = [c \in Clients |-> 0]
    /\ lastAckSeq = [c \in Clients |-> 0]
    /\ dbCards = [card \in Cards |-> "L1"]
    /\ dbLists = Lists
    /\ network = {}

\* Action 1: Client optimistically moves a card to targetList
ClientDrag(c, card, targetList) ==
    /\ clientCards[c][card] /= "DELETED"
    /\ targetList \in Lists
    /\ targetList /= clientCards[c][card]
    /\ LET newSeq == clientSeq[c] + 1
       IN
         /\ clientSeq' = [clientSeq EXCEPT ![c] = newSeq]
         /\ clientPending' = [clientPending EXCEPT ![c][card] = [
                                active |-> TRUE,
                                seq |-> newSeq,
                                snapshot |-> clientCards[c][card]
                              ]]
         /\ clientCards' = [clientCards EXCEPT ![c][card] = targetList]
         /\ network' = network \union {MsgReq(c, newSeq, card, targetList)}
         /\ UNCHANGED <<lastAckSeq, dbCards, dbLists>>

\* Action 2: Server processes move request
ServerHandleReq ==
    /\ \E msg \in network :
         /\ msg.type = "REQ"
         /\ IF dbCards[msg.card] = "DELETED"
            THEN
              \* Card was deleted in DB
              /\ network' = (network \ {msg}) \union {MsgResp(msg.client, msg.seq, msg.card, FALSE, "CARD_DELETED")}
              /\ UNCHANGED <<clientCards, clientPending, clientSeq, lastAckSeq, dbCards, dbLists>>
            ELSE IF msg.targetList \in dbLists
            THEN
              \* Target list exists: persist move and send success
              /\ dbCards' = [dbCards EXCEPT ![msg.card] = msg.targetList]
              /\ network' = (network \ {msg}) \union {MsgResp(msg.client, msg.seq, msg.card, TRUE, msg.targetList)}
              /\ UNCHANGED <<clientCards, clientPending, clientSeq, lastAckSeq, dbLists>>
            ELSE
              \* Target list was deleted: reject with failure (LIST_NOT_FOUND)
              /\ network' = (network \ {msg}) \union {MsgResp(msg.client, msg.seq, msg.card, FALSE, "LIST_NOT_FOUND")}
              /\ UNCHANGED <<clientCards, clientPending, clientSeq, lastAckSeq, dbCards, dbLists>>

\* Action 3: Server concurrently deletes a list (Cascade delete in DB)
ServerDeleteList(l) ==
    /\ Cardinality(dbLists) > 1
    /\ l \in dbLists
    /\ dbLists' = dbLists \ {l}
    /\ dbCards' = [card \in Cards |-> IF dbCards[card] = l THEN "DELETED" ELSE dbCards[card]]
    /\ UNCHANGED <<clientCards, clientPending, clientSeq, lastAckSeq, network>>

\* Action 4: Client receives response with defensive rollback and monotonic sequence check
ClientHandleResp ==
    /\ \E msg \in network :
         /\ msg.type = "RESP"
         /\ LET c == msg.client
                card == msg.card
                pending == clientPending[c][card]
            IN
              /\ IF msg.seq <= lastAckSeq[c]
                 THEN
                   \* STALE RESPONSE (arrived out of order): drop to prevent UI flicker
                   /\ network' = network \ {msg}
                   /\ UNCHANGED <<clientCards, clientPending, clientSeq, lastAckSeq, dbCards, dbLists>>
                 ELSE
                   \* FRESH RESPONSE: update last acknowledged sequence ID
                   /\ lastAckSeq' = [lastAckSeq EXCEPT ![c] = msg.seq]
                   /\ network' = network \ {msg}
                   /\ IF msg.success
                      THEN
                        \* SUCCESS: commit optimistic update, deactivate pending
                        /\ clientPending' = [clientPending EXCEPT ![c][card].active = FALSE]
                        /\ UNCHANGED <<clientCards, clientSeq, dbCards, dbLists>>
                      ELSE
                        \* FAILURE (LIST_NOT_FOUND or rejection):
                        \* Reconcile: If snapshot list still exists, revert to snapshot; otherwise DELETED
                        /\ clientCards' = [clientCards EXCEPT ![c][card] = 
                                            IF pending.snapshot \in dbLists THEN pending.snapshot ELSE "DELETED"]
                        /\ clientPending' = [clientPending EXCEPT ![c][card].active = FALSE]
                        /\ UNCHANGED <<clientSeq, dbCards, dbLists>>
              /\ UNCHANGED <<dbCards, dbLists>>

\* Action 5: Client syncs state with server (e.g. Next.js revalidate / router refresh)
ClientSync(c) ==
    /\ \A card \in Cards : ~clientPending[c][card].active
    /\ clientCards' = [clientCards EXCEPT ![c] = dbCards]
    /\ UNCHANGED <<clientPending, clientSeq, lastAckSeq, dbCards, dbLists, network>>

Next ==
    \/ \E c \in Clients, card \in Cards, l \in Lists : ClientDrag(c, card, l)
    \/ ServerHandleReq
    \/ \E l \in Lists : ServerDeleteList(l)
    \/ ClientHandleResp
    \/ \E c \in Clients : ClientSync(c)

\* --- Safety Invariants ---

\* 1. No Orphan Cards: When quiescent and synced, all non-deleted cards on client reside in a valid DB list
NoOrphanCardsWhenSettled ==
    (\A c \in Clients, card \in Cards : ~clientPending[c][card].active /\ network = {}) =>
        \A c \in Clients, card \in Cards : 
            (clientCards[c][card] = dbCards[card]) =>
                (clientCards[c][card] /= "DELETED" => clientCards[c][card] \in dbLists)

\* 2. Eventual Consistency: If client is synced and quiescent, client agrees with DB
EventualConsistency ==
    (\A c \in Clients, card \in Cards : ~clientPending[c][card].active /\ network = {}) =>
        \A c \in Clients, card \in Cards : 
            (clientCards[c][card] = dbCards[card])

\* 3. Monotonic Sequence: Last acknowledged sequence never exceeds current client sequence
MonotonicSeqCheck ==
    \A c \in Clients : lastAckSeq[c] <= clientSeq[c]

\* State space constraint for bounded model checking
SeqConstraint ==
    \A c \in Clients : clientSeq[c] <= 2

Spec == Init /\ [][Next]_vars
====
